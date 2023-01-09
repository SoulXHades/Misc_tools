import argparse
import os
import subprocess


def initialize_parser():
    parser = argparse.ArgumentParser(
        description='''A CMD tool to search for files that contains the given string.''')
    parser.add_argument('thepath',
                        help="Absolute path to the file.")
    parser.add_argument('thestring',
                        help="The string to search for.")
    return parser.parse_args()

def cmd_run_blocking(cmd: tuple) -> list[str]:
    """Run a CMD commnd blockingly.
    
    Parameters
    ----------
    cmd: tuple
        Same content as what will be given to subprocess.Popen().
    
    Return
    ------
    result: list[str]:
        Stdout result decoded with UTF-8.
    """
    out = subprocess.Popen(cmd, 
           stdout=subprocess.PIPE, 
           stderr=subprocess.STDOUT)
    stdout,stderr = out.communicate()
    return stdout.decode('utf-8').split('\n')


def find_files_w_str(thepath: str, lestr: str) -> list[str]:
    """The main function. Search for files that contains the given string.

    Parameters
    ----------
    thepath: str
        Absolute path to the folder.
    lestr: str
        The string to search for.
    
    Return
    ------
    files_found: list[str]
        Files that contains the given string.
    """
    files_found = list()

    for top, dirs, files in os.walk(thepath):
        for file in files:
            thefilepath = os.path.join(top, file)
            stringslist_str = str(cmd_run_blocking(["stringsext", "--encoding=UTF-16LE", "--encoding=UTF-8", "-c", thefilepath]))

            if lestr in stringslist_str:
                print(thefilepath)
                files_found.append(thefilepath)
    
    return files_found


if __name__ == "__main__":
    args = initialize_parser()
    reports = find_files_w_str(thepath=args.thepath, lestr=args.thestring)
