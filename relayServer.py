
from threading import Thread
# For autobahn
import json
import sys
import time
from os import path
from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
from twisted.internet import reactor

try:
    from Queue import Queue, Full
except ImportError:
    from queue import Queue, Full



sys.path.append(path.abspath('/home/ubuntu/virtualAssistant'))

from virtual_assistant import VirtualAssistant
from va_server import Server

###############################################
#### Initalize queue to store the recordings ##
###############################################
CHUNK = 1024
# Note: It will discard if the websocket client can't consumme fast enough
# So, increase the max size as per your choice
BUF_MAX_SIZE = CHUNK * 10
# Buffer to store audio
#q = Queue(maxsize=int(round(BUF_MAX_SIZE / CHUNK)))
# Create an instance of AudioSource
#audio_source = AudioSource(q, True, True)

###############################################
#### Prepare Speech to Text Service ########
###############################################

# initialize speech to text service
#authenticator = IAMAuthenticator('secretapikey')
#speech_to_text = SpeechToTextV1(authenticator=authenticator)

# define callback for the speech to text service
'''
class MyRecognizeCallback(RecognizeCallback):
    def __init__(self):
        RecognizeCallback.__init__(self)

    def on_transcription(self, transcript):
        # Forward to client
        MyServerProtocol.broadcast_message(transcript)

    def on_connected(self):
        print('Connection was successful')

    def on_error(self, error):
        # Forward to client
        MyServerProtocol.broadcast_message('Error received: {}'.format(error))

    def on_inactivity_timeout(self, error):
        # Forward to client
        MyServerProtocol.broadcast_message('Inactivity timeout: {}'.format(error))

    def on_listening(self):
        print('Service is listening')

    def on_hypothesis(self, hypothesis):
        # Forward to client
        MyServerProtocol.broadcast_message(hypothesis)

    def on_data(self, data):
        # Forward to client
        MyServerProtocol.broadcast_message(data)

    def on_close(self):
        print("Connection closed")
        MyServerProtocol.broadcast_message("Connection closed")
'''

class VirtualAssistantCallback(VirtualAssistant):
    def __init__(self, server, conn, resourcePath):
        print("INIT")
        VirtualAssistant.__init__(self, server, conn, resourcePath)

class MyServerProtocol(WebSocketServerProtocol):
    connections = list()
    dataStorage = None
    test_var = "From my server protocol class"
    q = Queue(maxsize=int(round(BUF_MAX_SIZE / CHUNK)))

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))
        self.connections.append(self)
        # Start recognizer on connection
        recognize_thread = Thread(target=invoke_virtualAssistant, args=())
        recognize_thread.daemon = True
        recognize_thread.start()

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:

            MyServerProtocol.dataStorage = payload
            # Put incoming audio into the queue
            '''
            try:
                self.q.put(payload)
                
            except Full:
                print("Full")
                pass # discard
            '''
        else:
            print("Text message received: {0}".format(payload.decode('utf8')))

    @classmethod
    def broadcast_message(cls, data):
        payload = json.dumps(data, ensure_ascii = False).encode('utf8')
        for c in set(cls.connections):
            reactor.callFromThread(cls.sendMessage, c, payload)
    
    @classmethod
    def sendMsg(cls, data):
        for c in set(cls.connections):
            cls.sendMessage(c, data)


    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))
        self.connections.remove(self)
 
## this function will initiate the recognize service and pass in the AudioSource
def invoke_virtualAssistant(*args):
    print("Thread Started.")
    low_confidence = -2.94 
    high_confidence = 2.94
    predictions = []
    confidences = []
    server = Server(port=5000)
    virtualAssistant = VirtualAssistantCallback(server, MyServerProtocol, "/home/ubuntu/virtualAssistant/va_resources/")
    virtualAssistant.connection_token = MyServerProtocol
    time.sleep(6.5)
    virtualAssistant.play_va_voice("announce.flac")
    chosen_question = virtualAssistant.choose_question()
    virtualAssistant.next_interaction(chosen_question, predictions, confidences)
    virtualAssistant.num_predictions = virtualAssistant.num_predictions+1
    srpt = virtualAssistant.calculate_SRPT(confidences[0], 0)


    for i in range(1,6):
                    
        #dprint("number of predictions ", num_predictions)
        chosen_question = virtualAssistant.choose_question()
        virtualAssistant.next_interaction(chosen_question, predictions, confidences)
        virtualAssistant.num_predictions = virtualAssistant.num_predictions+1
        srpt = virtualAssistant.calculate_SRPT(confidences[i], srpt)
        #print(srpt)
        
        maj = virtualAssistant.majority(predictions)
        decision = virtualAssistant.make_decision(maj, srpt, low_confidence, high_confidence)
        if decision <0: 
            continue
        else:
            virtualAssistant.end_call_formalities(decision)
            break
        '''
        #dprint("last statement ", last_statement)
        if (virtualAssistant.num_predictions == 2):
            if(predictions[0] == predictions[1] and (confidences[0] >= high_confidence and confidences[1] >= high_confidence)):
                decision = predictions[0]
                virtualAssistant.end_call_formalities(decision, context)
                break
        elif (virtualAssistant.num_predictions ==3):
            confidences_np = np.array(confidences)
            maj = virtualAssistant.majority(predictions)
            maj_index = np.argwhere(predictions== maj)
            maj_confidences = confidences_np[maj_index] <= low_confidence
            if (sum(maj_confidences) != 2):
                decision = maj
                virtualAssistant.end_call_formalities(decision, context)
                break
        elif (virtualAssistant.num_predictions ==4): 
            maj = virtualAssistant.majority(predictions)
            if (maj != None):
                decision = maj
                virtualAssistant.end_call_formalities(decision, context)
                break
        elif (virtualAssistant.num_predictions ==5):
            maj = virtualAssistant.majority(predictions)
            decision = maj
            virtualAssistant.end_call_formalities(decision, context)
            break
        '''
    print("Call Ended")
    MyServerProtocol.sendMsg("end".encode('utf-8'))
    #conn.sendall(b"stop")








    
if __name__ == '__main__':

    factory = WebSocketServerFactory('wss://3.223.58.2:5001')
    factory.protocol = MyServerProtocol

    reactor.listenTCP(5001, factory)
    reactor.run()