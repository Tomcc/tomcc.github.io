
s = ""

for x in range(0,16):
	for y in range(0,16):
		if x == 0 or x == 15 or y == 0 or y == 15:
			s += "{x:" + str(x) + ",y:" + str(y) + "}, "

print s;