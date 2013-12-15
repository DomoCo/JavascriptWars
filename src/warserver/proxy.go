package warserver

import (
    "github.com/gorilla/websocket"
    "io"
    "net"
    "net/http"
    "warserver/logger"
)

const (
    RECV_BUF_LEN = 1024
    SERVER_IP = "localhost"
    SERVER_PORT = "5269"
)

type websocketHandler interface {
    handleWebsocket(message []byte, cconn *clientConnection)
}

type clientInfo struct {
    Id int
}

type clientConnection struct {
    ws *websocket.Conn
    currentHandler websocketHandler
    handlers chan websocketHandler
    toClient chan []byte
    info clientInfo
}

type pipe struct {
    wsRecv chan []byte
    sockRecv chan []byte
}

type proxy struct {
    proxyConns []*clientConnection
}

func (p *proxy) slotClientConnection(slot int, cconn *clientConnection) {
    p.proxyConns[slot] = cconn;
}

func (p *proxy) removeClientConnection(pos int) {
    j := pos + 1
    copy(p.proxyConns[pos:], p.proxyConns[j:])
    for k, n := len(p.proxyConns) - j + pos, len(p.proxyConns); k < n; k ++ {
        p.proxyConns[k] = nil // or the zero value of T
    } // for k
    p.proxyConns = p.proxyConns[:len(p.proxyConns) - j + pos]
}

func (p *proxy) handleWebsocket(message []byte, cconn *clientConnection) {
    logger.Infof("Proxying message: %s", message)
}

func (pc *clientConnection) wsReadPump() {
    defer func() {
        pc.ws.Close()
    }()
    pc.ws.SetReadLimit(RECV_BUF_LEN)
    for {
        _, msg, err := pc.ws.ReadMessage()
        if err != nil {
            if err == io.EOF {
                // the client ID here is redundant...
                killcconn := fmt.Sprintf("killClient:{\"Id\": %d}", pc.info.Id)
                pc.currentHandler.handleWebsocket([]byte(killcconn), pc)
            } else {
                logger.Errorf("Error while reading from websocket: %s", err)
            }
            break
        }
        logger.Debugf("Received %s from websocket", msg)
        select {
        case newHandler := <-pc.handlers:
            pc.currentHandler = newHandler
        default:
        }
        pc.currentHandler.handleWebsocket(msg, pc)
    }
}

func (pc *clientConnection) wsWritePump() {
    for msg := range pc.toClient {
        logger.Debugf("Writing %s to websocket", msg)
        err := pc.ws.WriteMessage(websocket.TextMessage, msg)
        if err != nil {
            logger.Errorf("Error while writing to websocket: %s", err)
            break
        }
    }
}

func connectToServer() (net.Conn, error) {
    return net.Dial("tcp", SERVER_IP + ":" + SERVER_PORT)
}

func serveWs(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
        http.Error(w, "Method not allowed", 405)
        return
    }
    if r.Header.Get("Origin") != "http://"+r.Host {
        http.Error(w, "Origin not allowed", 403)
        return
    }
    ws, err := websocket.Upgrade(w, r, nil, 1024, 1024)
    if _, ok := err.(websocket.HandshakeError); ok {
        http.Error(w, "Not a websocket handshake", 400)
        return
    } else if err != nil {
        logger.Errorf("Websocket upgrade error: %s", err)
        return
    }
    gamehub.wsRegister<- ws
}