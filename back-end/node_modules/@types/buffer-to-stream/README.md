# Installation
> `npm install --save @types/buffer-to-stream`

# Summary
This package contains type definitions for buffer-to-stream (https://github.com/creeperyang/buffer-to-stream#readme).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/buffer-to-stream.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/buffer-to-stream/index.d.ts)
````ts
/// <reference types="node" />

import { Readable } from "stream";

interface ToStream {
    (buffer: string | Buffer, chunkSize?: number): Readable;
}

declare const toStream: ToStream;

export = toStream;

````

### Additional Details
 * Last updated: Mon, 06 Nov 2023 22:41:05 GMT
 * Dependencies: [@types/node](https://npmjs.com/package/@types/node)

# Credits
These definitions were written by [tpluscode](https://github.com/tpluscode).
