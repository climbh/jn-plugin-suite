import { getAllFilesInThePath } from '@jsjn/generate-api-type'
import path from 'path'
// import path from 'path'


console.log(getAllFilesInThePath(path.resolve(__dirname)))