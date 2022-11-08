import idaapi
import ida_funcs

ea = get_screen_ea()    # Get cursor address
func = idaapi.get_func(ea)
func_offset = ea - func.start_ea
func_name = ida_funcs.get_func_name(ea)
print("Offset:")
print(func_name + "+" + hex(func_offset))