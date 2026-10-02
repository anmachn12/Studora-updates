// A code-drawn book icon, so the updater needs no remote assets.
const zlib=require('node:zlib');
module.exports=function trayIcon(){
  const size=32,raw=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const rounded=(x>=5&&x<27)||(y>=5&&y<27)||((x<16?x-5:x-26)**2+(y<16?y-5:y-26)**2<=25);
    const book=((x===8||x===9||x===15||x===16||x===22||x===23)&&y>=9&&y<=24)||((y===9||y===10||y===23||y===24)&&x>=8&&x<=23);
    const at=y*(size*4+1)+1+x*4;raw[at]=book?245:45;raw[at+1]=book?245:87;raw[at+2]=book?236:63;raw[at+3]=rounded?255:0;
  }
  const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let bit=0;bit<8;bit++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0};
  const chunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),checksum=Buffer.alloc(4);length.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,checksum])};
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
};
