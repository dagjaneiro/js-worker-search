import SearchIndex from './SearchIndex'

/**
 * Synchronous client-side full-text search utility.
 * Forked from JS search (github.com/bvaughn/js-search).
 */
export default class SearchUtility {

  /**
   * Constructor.
   */
  constructor () {
    this.searchIndex = new SearchIndex()
    this.uids = {}
  }

  /**
   * Adds or updates a uid in the search index and associates it with the specified text.
   * Note that at this time uids can only be added or updated in the index, not removed.
   *
   * @param uid Uniquely identifies a searchable object
   * @param text Text to associate with uid
   */
  indexDocument (uid: any, text: string): SearchUtility {
    this.uids[uid] = true

    var fieldTokens: Array<string> = this._tokenize(this._sanitize(text))

    fieldTokens.forEach(fieldToken => {
      var expandedTokens: Array<string> = this._expandToken(fieldToken)

      expandedTokens.forEach(expandedToken =>
        this.searchIndex.indexDocument(expandedToken, uid)
      )
    })

    return this
  }

  removeDocument (uid: any): SearchUtility {
    this.uids[uid] = true

    if (this.uids[uid]) {
      this.searchIndex.removeDocument(uid)
      this.uids[uid] = null
    }

    return this
  }

  /**
   * Searches the current index for the specified query text.
   * Only uids matching all of the words within the text will be accepted.
   * If an empty query string is provided all indexed uids will be returned.
   *
   * Document searches are case-insensitive (e.g. "search" will match "Search").
   * Document searches use substring matching (e.g. "na" and "me" will both match "name").
   *
   * @param query Searchable query text
   * @return Array of uids
   */
  search (query: string): Array<any> {
    if (!query) {
      return Object.keys(this.uids)
    } else {
      var tokens: Array<string> = this._tokenize(this._sanitize(query))

      return this.searchIndex.search(tokens)
    }
  }

  /**
   * Index strategy based on 'all-substrings-index-strategy.ts' in github.com/bvaughn/js-search/
   *
   * @private
   */
  _expandToken (token: string): Array<string> {
    var expandedTokens = []

    // String.prototype.charAt() may return surrogate halves instead of whole characters.
    // When this happens in the context of a web-worker it can cause Chrome to crash.
    // Catching the error is a simple solution for now; in the future I may try to better support non-BMP characters.
    // Resources:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt
    // https://mathiasbynens.be/notes/javascript-unicode
    try {
      for (let i = 0, length = token.length; i < length; ++i) {
        let prefixString: string = ''

        for (let j = i; j < length; ++j) {
          prefixString += token.charAt(j)
          expandedTokens.push(prefixString)
        }
      }
    } catch (error) {
      console.error(`Unable to parse token "${token}" ${error}`)
    }

    return expandedTokens
  }

  /**
   * @private
   */
  _sanitize (string: string): string {
    return string.trim().toLocaleLowerCase()
  }

  /**
   * @private
   */
  _tokenize (text: string): Array<string> {
    return text
      .split(/\s+/)
      .filter(text => text) // Remove empty tokens
  }
}
