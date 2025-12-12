import occt from "occt-import-js";
let OCCT:any = null;
async function initOCCT() {
  if (!OCCT) {
    OCCT = await occt({
      locateFile: (path:any) => {
        if (path.endsWith('.wasm')) {
          return '/js/occt-import-js.wasm';
        }
        return path;
      }
    });
  }
  
}

self.onmessage = async (e) => {
  const { type, buffer } = e.data;

  if (type === 'load') {
    await initOCCT();

    const fileBuffer = new Uint8Array(buffer);

    // 在 worker 内部解析 STEP，不阻塞主线程
    const result = await OCCT.ReadStepFile(fileBuffer);

    // 将解析结果发回主线程（Transferable，零拷贝）
    self.postMessage(
      { type: 'parsed', result }
    );
  }
};