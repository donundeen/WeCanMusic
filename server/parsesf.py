from sf2utils.sf2parse import Sf2File
import json


sf2dir = "/Users/donundeen/Documents/htdocs/WeCanMusic/server/soundfonts/"

filename1 = "/Users/donundeen/Documents/htdocs/WeCanMusic/server/soundfonts/Collections part 2/bloodwar.sf2"
filename2 = "/Users/donundeen/Documents/htdocs/WeCanMusic/server/soundfonts/804 SoundFonts/141-Compleet bank  synth.sf2"

all_data_file = sf2dir+"all_file_voices.json"

all_file_data  = []


def parsesf2file(filename):
    data= []
    with open(filename, 'rb') as sf2_file:
        sf2 = Sf2File(sf2_file)
        for preset in sf2.presets:
            if(hasattr(preset,"preset")):
#                for property, value in vars(preset).items():
#                    print(property)                
                print(str(preset.bank) + " : " + str(preset.preset) +":"+preset.name  )
                data.append((preset.bank, preset.preset, preset.name))
    return data


def processsf2file(alldata, filename):

    split = filename.split("/")
    shortname = split.pop()
    path= "/".join(split)+"/"
    outfile = path+shortname+".voicelist.json"


    filedata = parsesf2file(filename)
    alldata.append({
        "filename": filename, 
        "shortname": shortname,
        "voices": filedata
    })
    # Serializing json
    json_object = json.dumps(filedata, indent=4)
    # Writing to sample.json
    with open(outfile, "w") as writefile:
        writefile.write(json_object)
    return alldata



from pathlib import Path

for path in Path(sf2dir).rglob('*.sf2'):
    path = str(path)
    print(path)
    all_file_data = processsf2file(all_file_data, path)



with open(all_data_file, "w") as writefile:
    writefile.write(json.dumps(all_file_data, indent=4))





#print (json.dumps(all_file_data, indent=4))
#print(all_data_file)
