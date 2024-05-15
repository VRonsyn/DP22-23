#!/bin/sh
primary=".env";
secondary=".env.example";
output=".env";
tmp=0

while getopts p:s:o: flag
do
    case "${flag}" in
        p) primary=${OPTARG};;
        s) secondary=${OPTARG};;
        o) output=${OPTARG};;
    esac
done
echo "Copying environment variables from $primary and $secondary to $output";

if [ $primary == $output ]; then
    cp $primary .env.tmp;
    primary=".env.tmp";
    tmp=1;
fi


sort -u -t '=' -k 1,1 $primary $secondary | grep -v '^$\|^\s*\#' > $output

if [ $tmp == 1 ]; then
    rm .env.tmp
fi
