"""Convert Real-ESRGAN x4plus_anime_6B weights (.pth) to ONNX without needing torch.

Usage: python3 tools/esrgan_to_onnx.py RealESRGAN_x4plus_anime_6B.pth .cache/anime6b.onnx
"""
import zipfile, pickle, collections, numpy as np, onnx, sys
from onnx import helper, TensorProto, numpy_helper
z=zipfile.ZipFile(sys.argv[1])
def rebuild(storage, offset, size, stride, *a):
    it=storage.itemsize
    return np.lib.stride_tricks.as_strided(storage[offset:], shape=size, strides=[s*it for s in stride]).copy()
class U(pickle.Unpickler):
    def find_class(self, mod, name):
        if name=='_rebuild_tensor_v2': return rebuild
        if mod=='collections' and name=='OrderedDict': return collections.OrderedDict
        if name.endswith('Storage'): return name
        return super().find_class(mod,name)
    def persistent_load(self, pid):
        _, stype, key, loc, numel = pid
        dt={'FloatStorage':np.float32,'HalfStorage':np.float16}[stype]
        return np.frombuffer(z.read(f'archive/data/{key}'),dt)
sd=U(z.open('archive/data.pkl')).load()
if 'params_ema' in sd: sd=sd['params_ema']
elif 'params' in sd: sd=sd['params']
print(len(sd), list(sd)[:3])
nodes=[]; inits=[]; cnt=[0]
def nm(p): cnt[0]+=1; return f'{p}_{cnt[0]}'
def conv(x,key):
    w=sd[key+'.weight'].astype(np.float32); b=sd[key+'.bias'].astype(np.float32)
    inits.append(numpy_helper.from_array(w,key+'.w')); inits.append(numpy_helper.from_array(b,key+'.b'))
    o=nm('conv'); nodes.append(helper.make_node('Conv',[x,key+'.w',key+'.b'],[o],pads=[1,1,1,1],kernel_shape=[3,3])); return o
def lrelu(x): o=nm('lr'); nodes.append(helper.make_node('LeakyRelu',[x],[o],alpha=0.2)); return o
def cat(xs): o=nm('cat'); nodes.append(helper.make_node('Concat',xs,[o],axis=1)); return o
def add(a,b): o=nm('add'); nodes.append(helper.make_node('Add',[a,b],[o])); return o
c02=numpy_helper.from_array(np.array(0.2,np.float32),'c02'); inits.append(c02)
def mul02(a): o=nm('mul'); nodes.append(helper.make_node('Mul',[a,'c02'],[o])); return o
sc=numpy_helper.from_array(np.array([1,1,2,2],np.float32),'sc2'); inits.append(sc)
def up(x): o=nm('up'); nodes.append(helper.make_node('Resize',[x,'','sc2'],[o],mode='nearest')); return o
def rdb(x,p):
    x1=lrelu(conv(x,p+'.conv1')); x2=lrelu(conv(cat([x,x1]),p+'.conv2'))
    x3=lrelu(conv(cat([x,x1,x2]),p+'.conv3')); x4=lrelu(conv(cat([x,x1,x2,x3]),p+'.conv4'))
    x5=conv(cat([x,x1,x2,x3,x4]),p+'.conv5'); return add(mul02(x5),x)
f=conv('input','conv_first'); h=f
nb=len({k.split('.')[1] for k in sd if k.startswith('body.')})
for i in range(nb):
    o=h
    for r in (1,2,3): o=rdb(o,f'body.{i}.rdb{r}')
    h=add(mul02(o),h)
f=add(f,conv(h,'conv_body'))
f=lrelu(conv(up(f),'conv_up1')); f=lrelu(conv(up(f),'conv_up2'))
out=conv(lrelu(conv(f,'conv_hr')),'conv_last')
nodes.append(helper.make_node('Identity',[out],['output']))
g=helper.make_graph(nodes,'rrdb',[helper.make_tensor_value_info('input',TensorProto.FLOAT,[1,3,None,None])],[helper.make_tensor_value_info('output',TensorProto.FLOAT,[1,3,None,None])],inits)
m=helper.make_model(g,opset_imports=[helper.make_opsetid('',13)]); m.ir_version=8
onnx.save(m,sys.argv[2]); print('blocks',nb,'saved')
