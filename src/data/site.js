export default {

  // Gegevens voor metadata en de dockklok.
  name: "SC Cambuur",
  description: "Wedstrijdverslagen en statistieken van SC Cambuur.",
  lang: "nl",
  url: "https://scc.diederikdijkstra.nl", // Zonder afsluitende slash.
  dateNow: new Date(),
  // De dock (partials/dock.njk) staat tijdelijk uit; true zet hem terug.
  dock: false,
  // De plaats van de klok in de dock.
  location: {
    name: "Leeuwarden/NL",
    nameFy: "Liwwadden/058" // even lang als name: wisselen zonder dat de regel verspringt
  }

};
