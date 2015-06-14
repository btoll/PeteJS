import css_compress
import getopt
import js_compress
import sys
import textwrap

def usage():
    str = '''
        USAGE:

            CLI:
                python3 build.py -v 3.0.0 --js_src src/ --css_src resources/css/ --build_dir build

            As an imported module:
                build.build(version, js_src[, css_src, build_dir='.'])

        --version, -v      The version of the minified script, must be specified.
        --js_src           The location of the JavaScript source files, must be specified.
        --css_src          The location of the CSS files.
        --build_dir        The location where the minified files will be moved, defaults to cwd.
    '''
    print(textwrap.dedent(str))

def main(argv):
    version = ''
    js_src = ''
    css_src = None
    build_dir = '.'

    try:
        opts, args = getopt.getopt(argv, 'hv:', ['help', 'version=', 'js_src=', 'css_src=', 'build_dir='])
    except getopt.GetoptError:
        print('Error: Unrecognized flag.')
        usage()
        sys.exit(2)

    for opt, arg in opts:
        if opt in ('-h', '--help'):
            usage()
            sys.exit(0)
        elif opt in ('-v', '--version'):
            version = arg
        elif opt == '--js_src':
            js_src = arg
        elif opt == '--css_src':
            css_src = arg
        elif opt == '--build_dir':
            build_dir = arg

    build(version, js_src, css_src, build_dir)

def build(version, js_src, css_src=None, build_dir='.'):
    if not version:
        print('Error: You must provide a version.')
        sys.exit(2)

    if not js_src:
        print('Error: You must provide the location of the JavaScript source files.')
        sys.exit(2)

    # The order is very important due to some dependencies between scripts, so specify the dependency order here.
    dependencies = [
        'Pete.prototype.js',
        'Pete.js',
        'Pete.Element.js',
        'Pete.Composite.js',
        'Pete.Observer.js'
    ]

#    copyright = '''\
#        /*
#         * PeteJS {version!s}
#         *
#         * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
#         * Dual licensed under the MIT (MIT-LICENSE.txt)
#         * and GPL (GPL-LICENSE.txt) licenses.
#         *
#         */
#    '''.format(**locals())
#
#    # Write to a buffer.
#    buff = [textwrap.dedent(copyright)]

    js_output = 'Pete_' + version + '.min.js'
    css_output = 'Pete_CSS_' + version + '.min.js'

    js_compress.compress(js_src, js_output, build_dir, version, dependencies)

    if css_src:
        css_compress.compress(css_src, css_output, build_dir, version)

if __name__ == '__main__':
    if len(sys.argv) == 1:
        usage()
        sys.exit(2)

    main(sys.argv[1:])

