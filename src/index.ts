import {Options, WebsocketSettings} from './types';

export default class GracefulWebSocket {

    // Version
    public static readonly version = VERSION;

    /**
     * I could extend / use EventTarget because it's best practice and made for
     * exactly this purpose. ES6 classes are nearly 5 years old so the extend
     * syntax + super() should work right? Nope, Safari is insanely stupid and
     * doesn't even follow the very basic RFC's regarding extending EventTarget.
     * Just because of this single browser doing whatever it wants and giving a shit about developers
     * (not everyone wants to buy a god damn mac) we have to take care about event-handling by ourself.
     * See https://stackoverflow.com/questions/36675693/eventtarget-interface-in-safari?noredirect=1&lq=1
     */
    /* eslint-disable no-invalid-this */
    private readonly _eventProxy = document.createElement('div');
    public addEventListener: WebSocket['addEventListener'] = this._eventProxy.addEventListener.bind(this._eventProxy);
    public dispatchEvent: WebSocket['dispatchEvent'] = this._eventProxy.dispatchEvent.bind(this._eventProxy);
    public removeEventListener: WebSocket['removeEventListener'] = this._eventProxy.removeEventListener.bind(this._eventProxy);

    // Default options
    private readonly _options: Options = {
        ws: {
            protocols: [],
            url: ''
        },
        pingInterval: 5000,
        pingTimeout: 2500,
        retryInterval: 1000,
        com: {
            message: '__PING__',
            answer: '__PONG__'
        }
    };

    // Instance stuff
    private _closed = false;
    private _websocket: WebSocket | null = null;
    private _connected = false;

    // Timing id's
    private _disconnectionTimeoutId = 0;
    private _pingingTimeoutId = 0;
    private _retryIntervalId = 0;

    constructor(
        url: (Partial<Options> & {ws: WebsocketSettings}) | string,
        ...protocols: Array<string>
    ) {
        const {_options} = this;
        if (typeof url === 'string') {
            _options.ws = {
                url,
                protocols
            };
        } else {
            Object.assign(_options, url);
        }

        if (!_options.ws || !_options.ws.url) {
            throw new Error('You must provide at least a websocket url.');
        }

        this._websocket = null;
        this.start();
    }

    get pingInterval(): number {
        return this._options.pingInterval;
    }

    set pingInterval(value: number) {
        this._options.pingInterval = value;
    }

    get pingTimeout(): number {
        return this._options.pingTimeout;
    }

    set pingTimeout(value: number) {
        this._options.pingTimeout = value;
    }

    get retryInterval(): number {
        return this._options.retryInterval;
    }

    set retryInterval(value: number) {
        this._options.retryInterval = value;
    }

    // Websocket properties (https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
    get binaryType(): BinaryType | null {
        return this._websocket ? this._websocket.binaryType : null;
    }

    get bufferedAmount(): number | null {
        return this._websocket ? this._websocket.bufferedAmount : null;
    }

    get extensions(): string | null {
        return this._websocket ? this._websocket.extensions : null;
    }

    get protocol(): string | null {
        return this._websocket ? this._websocket.protocol : null;
    }

    get readyState(): number | null {
        return this._websocket ? this._websocket.readyState : null;
    }

    get url(): string | null {
        return this._websocket ? this._websocket.url : null;
    }

    // Custom properties
    get connected(): boolean {
        return this._connected;
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        const {_websocket} = this;

        if (_websocket) {
            _websocket.send(data);
        } else {
            throw new Error('Websocket isn\'t created yet.');
        }
    }

    public close(code?: number, reason?: string): void {
        const {_websocket} = this;

        if (this._closed) {
            throw new Error('Websocket already closed.');
        } else if (_websocket) {
            this._closed = true;

            // Clear retry-interval if currently in a pending state
            clearInterval(this._retryIntervalId);

            // Close websocket
            _websocket.close(code, reason);

            // Dispatch close event
            this.dispatchEvent(new CustomEvent('killed'));
        } else {
            throw new Error('Websocket isn\'t created yet.');
        }
    }

    private start(): void {
        const {com, pingInterval, pingTimeout, ws: {url, protocols}} = this._options;
        const ws = this._websocket = new WebSocket(url, protocols || []);

        ws.addEventListener('open', () => {

            // Update connection state and dispatch event
            this._connected = true;
            this.dispatchEvent(new CustomEvent('connected'));

            // Ping every 5s
            this._pingingTimeoutId = setInterval(() => {
                ws.send(com.message);

                this._disconnectionTimeoutId = setTimeout(() => {
                    ws.close();
                }, pingTimeout) as unknown as number;
            }, pingInterval) as unknown as number;
        });

        ws.addEventListener('message', e => {

            // Check if message is the answer of __ping__ stop propagation if so
            if (e.data === com.answer) {
                clearTimeout(this._disconnectionTimeoutId);
            } else {
                this.dispatchEvent(new MessageEvent('message', e as EventInit));
            }
        });

        ws.addEventListener('close', () => {

            // Clear timeouts
            clearTimeout(this._disconnectionTimeoutId);
            clearInterval(this._pingingTimeoutId);

            // Restart if not manually closed
            if (!this._closed) {
                this.restart();
            }
        });
    }

    private restart(): void {
        const wasConnected = this._connected;
        this._connected = false;

        // Dispatch custom event if it was connected previously
        if (wasConnected) {
            this.dispatchEvent(new CustomEvent('disconnected'));
        }

        // Check every second if ethernet is available
        this._retryIntervalId = setInterval(() => {
            if (navigator.onLine) {
                clearInterval(this._retryIntervalId);
                this.start();
            }
        }, this._options.retryInterval) as unknown as number;
    }
}
