This is the codebase for the visualization of bandcamp artist data to be published on https://components.one. See the demo at http://view.components.one.

Code overview:
- Data:
  - **world50.json** contains the geomap data.
  - **network_graph.json** contains the data that populates the map with city circles and generates the network visualizations.
  - **ng_ids.json** is used to translate the numerical ids in network_graph.json into genre names.
- Rendering:
  - **json_from_prepared_csvs.py** prepares network_graph.json from the cleaned data that Andrew provides as csvs.
  - **main.js** displays the visualization. The rendering all happens here.
  - **style.scss** is your friendly neighborhood stylesheet.
