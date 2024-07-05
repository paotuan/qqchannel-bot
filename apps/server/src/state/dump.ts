import { Doc, getPersistence } from '@paotuan/syncserver'
import fs from 'fs'
import { resolveRootDir } from '../utils'
import { isEqual } from 'lodash'
import { YChannelStateShape, YGlobalStateShape, YGuildStateShape } from '@paotuan/types'
import JSZip from 'jszip'

const ChannelUnionIdRegex = /^[a-z]+_\d+_\d+$/
const GuildUnionIdRegex = /^[a-z]+_\d+$/

export async function dump() {
  const ldb = getPersistence()?.provider
  if (!ldb) throw new Error('Persistence not inited')
  const allDocNames = await ldb.getAllDocNames()
  const ret: Record<string, any> = {}
  for (const docName of allDocNames) {
    const doc = await ldb.getYDoc(docName)
    // 需根据具体的 shape 读取数据才能 toJSON
    if (docName === 'global') {
      ret[docName] = docDump(doc, YGlobalStateShape)
    } else if (docName.match(ChannelUnionIdRegex)) {
      ret[docName] = docDump(doc, YChannelStateShape)
    } else if (docName.match(GuildUnionIdRegex)) {
      ret[docName] = docDump(doc, YGuildStateShape)
    }
  }
  // write file
  return await createZip(ret)
}

type YShapes = typeof YGlobalStateShape | typeof YGuildStateShape | typeof YChannelStateShape

function docDump(doc: Doc, shape: YShapes) {
  const ret: Record<string, any> = {}
  Object.keys(shape).forEach(prop => {
    const subdoc = docGet(doc, shape, prop as keyof typeof shape)
    if (subdoc) {
      ret[prop] = subdoc.toJSON()
    }
  })
  return ret
}

function docGet<T extends YShapes>(doc: Doc, shape: T, prop: keyof T) {
  const shapeObj = shape[prop]
  if (isEqual(shapeObj, {})) {
    return doc.getMap(prop as string)
  } else if (isEqual(shapeObj, [])) {
    return doc.getArray(prop as string)
  } else {
    console.warn(`Invalid prop: ${String(prop)} of shape`, shape)
    return undefined
  }
}

function createZip(record: Record<string, any>) {
  return new Promise((resolve, reject) => {
    const zipName = `dump_${nowDateStr()}.zip`
    const zipPath = `${resolveRootDir('')}${zipName}`
    const zip = new JSZip()
    Object.keys(record).forEach(filename => {
      const content = JSON.stringify(record[filename], null, 2)
      zip.file(`${filename}.json`, content)
    })
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(fs.createWriteStream(zipPath))
      .on('finish', () => resolve(zipName))
      .on('error', () => reject())
  })
}

function nowDateStr() {
  return new Date().toLocaleString().replace(/[/\s:,]/g, '_')
}
