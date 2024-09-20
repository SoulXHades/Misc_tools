import zlib
import sys

f = open(sys.argv[1],'rb')
o = open(sys.argv[1]+'.out','wb')
o.write(zlib.decompress(f.read(), -15))