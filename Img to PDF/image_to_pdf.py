from PIL import Image
import os
import sys

if len(sys.argv) != 3:
	print("Input " + sys.argv[0] + " <filename> <output_filename>")
	exit()

if not os.path.exists(sys.argv[1]):
	print(sys.argv[1] + " does not exist")
	exit()

image_1 = Image.open(sys.argv[1])
im_1 = image_1.convert('RGB')

output_file = sys.argv[2]
if output_file[-4:] != ".pdf":
	output_file += ".pdf"
im_1.save(output_file)