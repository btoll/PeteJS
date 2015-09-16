#!/bin/bash

# Execute everything in the current shell environment (don't create a subshell).
{
    mkdir build 2> /dev/null
    rm build/docs.bz2 2> /dev/null
    cp -r docs build/docs
    cp -r src build/docs/src
    mkdir -p build/docs/resources/css build/docs/resources/images
    cp -r resources/css build/docs/resources
    cp -r resources/images build/docs/resources
    tar cjvf build/docs.bz2 build/docs &> /dev/null
    rm -rf build/docs
}

