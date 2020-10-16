const fs = require('fs')
const path = require('path')
const F = `../realm-js/`

//console.log('dbg: ', process.env['DEBUG'])
let DEBUG = false

if(process.env['DEBUG'] === 1) 
    DEBUG = true


const curr_time = () => {
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    return time
}


const ignore_files_xcode_and_hidden = (entry) => entry.isDirectory() && !entry.name.includes('.xcodeproj') && !entry.name.includes('.')

const recursive_watch = async (folder, fn) => {
    const { readdir } = require('fs').promises;
    const entries = await readdir(folder, { withFileTypes: true })
    let folders = entries.filter( ignore_files_xcode_and_hidden )

    if(folders.length > 0)
        folders.forEach(_folder => recursive_watch( path.normalize( folder+'/'+_folder.name ), fn))

    //if(DEBUG)
    //console.log('watch this folder: ', folder)

    watch_folder(folder, fn)
}

const watch_folder = (folder, fn) => {
    let timer = undefined

    fs.watch(folder, {persistent:true}, function(evt, filename) {
        //console.log('watch -> ', evt, filename)
        let full_location = `${folder}/${filename}`
        let state = fs.existsSync(full_location)? 'updated':'deleted'
        fn({state, full_location, filename})
    })
}

const copy = (src, dest) => {
    fs.copyFile(src, dest, (err) =>  { if(err) console.log('error while copying: ', err) })

    if(DEBUG)
        console.log(`debug: copying filename ${src} to ${dest}`)
}

const folder_to_update = (folder) => {
    let node_module_destination = fs.readFileSync('./cfg').toString().replace('\n', '') 
    node_module_destination = `${node_module_destination}`

    if(DEBUG)
        console.log('debug -> ', node_module_destination)

    if(!fs.existsSync(node_module_destination)){
        console.log(`Folder ${node_module_destination} not found...`)
        process.exit(1)
    }

    return node_module_destination 
}

const syncLibraries = () => {
    let dests = android_destination_folder() 
    let sources = targets.reduce((curr, next) => Object.assign(curr, {[next]:`${rsb(next)}/`}) , {}) 

    if(DEBUG){
        console.log('dests: ', dests)
        console.log('source: ', sources)
    }

    Object.keys(sources).forEach(target => {
        copy(`${sources[target]}/librealmreact.so`,`${dests[target]}/librealmreact.so`)
    }) 
}


const merge = (source, destination) => {

    let src = source.split('/')
    let dst = destination.split('/')

    let filename = src.pop()  
    let dst_root = dst.pop()

    let range = src.length - 1 
    let path = [] 

    while( range >= 0 ){

        if( dst_root === src[range] ) {
            destination = destination+'/'+path.join('/') 
            if(fs.existsSync(destination)){
                destination = destination + '/' + filename
                return {src: source,  dst: destination}
            }else{
                console.log( `refusing to merge ${source} and ${destination} doesn't have the same folder structure...`)
                process.exit(1)
            }
        }else  
            path.unshift(src[range])

        range--
    }

    console.log( `refusing to merge ${source} and ${destination} doesn't have the same folder structure...`)
    process.exit(1)
}

const merge_append = (_source, _destination, _fname) => {
    let edge_folder = _source.split('/')

    return (source, destination) => {
        let path = source.split('/').filter(s => !edge_folder.find(e => e === s) )
        let dst = destination+'/'+path.join('/')

        if(DEBUG) {
            console.log('resulting path: ', path)
            console.log('destination -> ', )
        }

        return {src: source, dst }
    }
}

const sourcesSync = async (_merge_module, source, destination, regex) => {
    let _merge = _merge_module(source, destination)
    await recursive_watch(source, (change) => {

        if(change.state === 'updated' && regex.test(change.filename)) {
            let merged = _merge(change.full_location, destination)
            copy(merged.src, merged.dst)

            //console.log('copying ', merged.src, ' to: ', merged.dst)
            console.log(`sync done for: ${change.filename}. `,curr_time())
        }
    })
}

const syncByMerging = sourcesSync.bind(null, () => merge)
const syncByAppend  = sourcesSync.bind(null, merge_append)

let arg = process.argv[2]
//if(arg === 'sync')
//  syncLibraries()
//runAndroid()


/* look for source files */
syncByAppend('../realm-js/src', 
            '../react-native-realm/node_modules/realm/src', 
            RegExp('.*'))

/*listen for changes on nodejs module*/
syncByAppend('../realm-js/compiled', 
            '../hello-sync/node_modules/realm/compiled', 
            RegExp('realm.node'))
            

/*listen for changes on nodejs module*/
syncByAppend('../realm-js/react-native/android/build/realm-react-ndk/all', 
            '../react-native-realm/node_modules/realm/android/src/main/jniLibs', 
            RegExp('librealmreact.so'))

//test
//syncByAppend('./a/p', './b/p', RegExp('.*'))
