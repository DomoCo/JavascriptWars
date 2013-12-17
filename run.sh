#!/bin/sh

pushd $(dirname $0) > /dev/null

export GOPATH=$(pwd)

kill `pgrep jswars`
go get
go build -o jswars
./jswars > server.log 2>&1 &

popd > /dev/null