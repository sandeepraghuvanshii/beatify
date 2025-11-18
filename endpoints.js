// endpoints.js
const BASE_URL = "https://www.jiosaavn.com/api.php";

const endpoints = {
  launchData: () =>
    `${BASE_URL}?__call=webapi.getLaunchData&api_version=4&_format=json&_marker=0&ctx=wap6dot0`,

  searchAutocomplete: (query) =>
    `${BASE_URL}?__call=autocomplete.get&query=${encodeURIComponent(query)}&ctx=web6dot0&api_version=4&_format=json&_marker=0`,

  searchResults: (query) =>
    `${BASE_URL}?__call=search.getResults&query=${encodeURIComponent(query)}&ctx=web6dot0&api_version=4&_format=json&_marker=0`,

  songDetails: (token) =>
    `${BASE_URL}?__call=webapi.get&token=${encodeURIComponent(token)}&type=song&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`,

  playlistDetails: (token) =>
    `${BASE_URL}?__call=webapi.get&token=${encodeURIComponent(token)}&type=playlist&p=0&n_song=50&ctx=wap6dot0&api_version=4&_format=json&_marker=0`,

  albumDetails: (token) =>
    `${BASE_URL}?__call=webapi.get&token=${encodeURIComponent(token)}&type=album&p=0&n_song=50&ctx=wap6dot0&api_version=4&_format=json&_marker=0`,

  artistDetails: (token) =>
    `${BASE_URL}?__call=webapi.get&token=${encodeURIComponent(token)}&type=artist&p=0&n_song=50&n_album=50&sub_type=&category=&sort_order=&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`,

  lyrics: (token) =>
    `${BASE_URL}?__call=lyrics.getLyrics&token=${encodeURIComponent(token)}&ctx=web6dot0&api_version=4&_format=json&_marker=0`,
};

export { BASE_URL };
export default endpoints;
