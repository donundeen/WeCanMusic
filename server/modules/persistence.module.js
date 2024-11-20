// Handle storage and retreival of data

const fs = require('node:fs');
const { readFileSync } = require('fs');

let Persistence = {
    storage_dir : "persistence",

    generate_filename(name){
        return this.storage_dir + "/"+name+".json";
    },

    get_json(name){
        let path = this.generate_filename(name);
        try{
            const datastring = readFileSync(path);
            let data = JSON.parse(datastring);        
            return data;
        }catch(e){
            console.log("file load error ", e);
            return false;
        }
    },

    save_json(name, json){
        let path = this.generate_filename(name);
        try {
            writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');
            console.log('Data successfully saved to disk');
            return true;
        } catch (error) {
            console.log('An error has occurred ', error);
            return false;
        }
    }
}

exports.Persistence = Persistence;