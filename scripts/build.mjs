import fs from "node:fs";
fs.rmSync("dist/public",{recursive:true,force:true});fs.mkdirSync("dist",{recursive:true});fs.cpSync("public","dist/public",{recursive:true});
