/**
 * Manages a persistent connection from a content script to the background script,
 * automatically handling disconnections and reconnections for BFCache events.
 */
class ContentScriptConnector {
    constructor() {
      /** @type {chrome.runtime.Port | null} */
      this.port = null;
  
      // Bind the event handler methods to this instance to ensure `this` is correct.
      this._handlePageHide = this._handlePageHide.bind(this);
      this._handlePageShow = this._handlePageShow.bind(this);
  
      // Set up the listeners and make the initial connection.
      this._setupEventListeners();
      this.connect();
    }
  
    /**
     * Establishes a connection to the background script. If a port already exists,
     * it disconnects it before creating a new one.
     */
    connect() {
      if (this.port) {
        this.port.disconnect();
      }
  
      this.port = chrome.runtime.connect({ name: "my-content-script" });
      console.log("✅ Connected to background script.");
  
      // Listen for when the other end disconnects (e.g., background script update).
      this.port.onDisconnect.addListener(() => {
        console.log(" Port disconnected from the other side.");
        this.port = null; // Clear the reference to allow for reconnection.
      });
  
      // You can add other message listeners here.
      // Example:
      // this.port.onMessage.addListener((message) => {
      //   console.log("Received message:", message);
      // });
    }
  
    /**
     * Disconnects the port if it's currently active.
     */
    disconnect() {
      if (this.port) {
        this.port.disconnect();
        this.port = null;
        console.log("Disconnected from background script for BFCache.");
      }
    }
  
    /**
     * Sets up window event listeners for BFCache.
     * @private
     */
    _setupEventListeners() {
      window.addEventListener('pagehide', this._handlePageHide);
      window.addEventListener('pageshow', this._handlePageShow);
    }
  
    /**
     * Handles the 'pagehide' event.
     * @param {PageTransitionEvent} event
     * @private
     */
    _handlePageHide(event) {
      // If event.persisted is true, the page is entering the BFCache.
      if (event.persisted) {
        this.disconnect();
      }
    }
  
    /**
     * Handles the 'pageshow' event.
     * @param {PageTransitionEvent} event
     * @private
     */
    _handlePageShow(event) {
      // If event.persisted is true, the page was restored from BFCache.
      if (event.persisted) {
        this.connect();
      }
    }
  }
  
  // Export the class for use in other modules.
  module.export = ContentScriptConnector;