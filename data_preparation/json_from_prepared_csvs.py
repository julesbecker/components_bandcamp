import csv
import os
import json
import pandas as pd
from itertools import chain, combinations
from collections import Counter
import functools
import operator
from tqdm.notebook import tqdm

album_sheet = os.environ["ALBUMS"]
node_sheet = os.environ["GENRES"]

alias_file =  "./data/ng_ids.json"
json_file = "./data/network_graph.json"

def genre_lookup(place_obj, genre):
    key_list = list(alias_json.keys())
    val_list = list(alias_json.values())
    g_match = val_list.index(genre)
    return key_list[g_match]

album_data = pd.read_csv(album_sheet)

### city-grouped tallying, edges ###
grouped = album_data.groupby('standard_name')
Collected_edges = pd.DataFrame(columns =['genre1', 'genre2','count','location'])

for place, group in grouped:
    edge_list = []
    genre_list = group['genre']
    for item in genre_list:
        genres_in_list = sorted(list(item.split(",")))
        genre_combs = combinations(genres_in_list, 2)
        for combination in genre_combs:
            edge_list.append([combination])
    edge_tally = Counter(chain(*edge_list))

    edge_tallies_dict = dict(edge_tally)

    edgeprep_dataframe = pd.DataFrame.from_dict(edge_tallies_dict, orient='index')
    edgeprep_dataframe.rename(columns = {0:'count'}, inplace = True)
    edgeprep_dataframe['genre_pair'] = edgeprep_dataframe.index
    edgeprep_dataframe.index = edgeprep_dataframe.reset_index().index

    genre_edges = pd.DataFrame(list(edgeprep_dataframe['genre_pair']), columns =['genre1', 'genre2'])

    genre_edges = genre_edges.join(edgeprep_dataframe['count'])
    genre_edges['location'] = place
    Collected_edges = Collected_edges.append(genre_edges)

# produce id json
df1 = pd.DataFrame(Collected_edges['genre1'].value_counts())
df2 = pd.DataFrame(Collected_edges['genre2'].value_counts())
dfc = pd.concat([df1, df2], axis=1, sort=False)
dfc["total"] = dfc.sum(axis=1)
dfc['name'] = dfc.index
dfc = dfc.sort_values(['total'], ascending = (False)).reset_index()

alias_json = {}
for i, row in dfc.iterrows():
    alias_json[i] = row[0]

with open(alias_file, "w") as jsonFile:
    json.dump(alias_json, jsonFile, separators=(',', ':'))


### produce network_graph.json ###
# order rows so most frequent genres have the smallest numbers
node_reader = pd.read_csv(node_sheet).sort_values(['location', "count"], ascending = (True, False))
json_output = []
for row in node_reader.itertuples():
    place_obj = {'n':[], 'l':[], 'w': 1}
    place_matches = [obj for obj in json_output if obj['ct'] == row.location]
    if not place_matches:
        place_obj['ct'] = row.location
        place_obj['cor'] = [row.lng, row.lat]
        json_output.append(place_obj)
    elif place_matches:
        place_obj = place_matches[0]
    g = genre_lookup(place_obj, row.genre)
    place_obj["n"].append({"g":g,"c":row.count,"r":round(row.relative, 3)})

for row in Collected_edges.itertuples():
    place_matches = [obj for obj in json_output if obj['ct'] == row.location]
    # if no location match with cities from node file, print city name before script fails
    if not place_matches:
        print(row)
    place_obj = place_matches[0]
    g1 = genre_lookup(place_obj, row.genre1)
    g2 = genre_lookup(place_obj, row.genre2)
    genre_matches = [obj for obj in place_obj['l'] if obj['s'] == g1]
    if not genre_matches:
        gm = {'s': g1, 'ts': []}
        place_obj['l'].append(gm)
    elif genre_matches:
        gm = genre_matches[0]
    gm['ts'].append({'t': g2, "c":row.count})
    if row.count > place_obj["w"]:
        place_obj["w"] = row.count

with open(json_file, "w") as jsonFile:
    json.dump(json_output, jsonFile, separators=(',', ':'))
