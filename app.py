import asyncio
import json
import websockets
import time
import socket
import threading
import http.server
import socketserver
import webbrowser
import os
import sys
import qrcode
from PIL import Image, ImageTk
import tkinter as tk
from io import BytesIO
import threading

# Global variables
HTTP_PORT = 8000
WS_PORT = 8765
counters = {}
connected_clients = set()
timer_state = {
    "type": "timer-sync",
    "isRunning": False,
    "startTime": 0,
    "pausedTime": 0
}

# Get the application directory 
if getattr(sys, 'frozen', False):
    # Running as compiled exe
    app_dir = os.path.dirname(sys.executable)
else:
    # Running as script
    app_dir = os.path.dirname(os.path.abspath(__file__))

# Change to the application directory to ensure access to HTML/JS/CSS files
os.chdir(app_dir)

# HTTP Server setup
class ScoreCounterHTTPServer(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self, daemon=True)
        self.httpd = None
        
    def run(self):
        handler = http.server.SimpleHTTPRequestHandler
        self.httpd = socketserver.TCPServer(("0.0.0.0", HTTP_PORT), handler)
        print(f"HTTP server started at http://localhost:{HTTP_PORT}")
        self.httpd.serve_forever()
    
    def stop(self):
        if self.httpd:
            self.httpd.shutdown()

# WebSocket server handler
async def counter_server(websocket):
    global timer_state
    client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
    print(f"Client connected: {client_info}")
    
    connected_clients.add(websocket)
    try:
        # Send initial counter values
        await websocket.send(json.dumps({
            "type": "counters", 
            "values": counters
        }))
        
        # Send initial timer state
        await websocket.send(json.dumps(timer_state))
        
        async for message in websocket:
            data = json.loads(message)

            if data['type'] == 'subtract-counter':
                counter_id = data.get('counterId')
                if not counter_id:
                    print("Warning: Received subtract-counter without counter ID")
                    continue
                value = data.get('value', 1)
                
                # Prevent negative values
                current_value = counters.get(counter_id, 0)
                new_value = max(0, current_value - value)
                
                counters[counter_id] = new_value
                
                # Broadcast updated counter values
                await broadcast({"type": "counters", "values": counters})
            
            elif data.get("type") == "increment":
                counter_id = data.get("counterId")
                value = data.get("value", 1)
                
                # Create the counter if it doesn't exist
                if counter_id not in counters:
                    counters[counter_id] = 0
                
                # Increment the counter
                counters[counter_id] += value
                
                # Broadcast updated counter values
                await broadcast({"type": "counters", "values": counters})
                
            elif data.get("type") == "reset-counters":
                # Reset all counters to zero
                counters.clear()
                
                # Broadcast updated counter values
                await broadcast({"type": "counters", "values": counters})
                
            elif data.get("type") == "timer-start":
                # Store the duration in a local variable
                duration = data.get("duration", timer_state.get("duration", 60))
                
                # Calculate current timestamp for elapsed time calculation
                current_time = int(time.time() * 1000)
                start_time = data.get("startTime", current_time)
                
                # Calculate elapsed time
                elapsed_time = data.get("elapsedTime", 0)
                
                timer_state = {
                    "type": "timer-start",
                    "isRunning": True,
                    "startTime": start_time,
                    "elapsedTime": elapsed_time,
                    "pausedTime": 0,
                    "pausedTimeRemaining": 0,
                    "duration": duration
                }
                
                # Broadcast to all clients
                await broadcast(timer_state)
                            
            elif data.get("type") == "timer-pause":
                # Get a valid pausedTime value
                pausedTime = data.get("pausedTime")
                pausedTimeRemaining = data.get("pausedTimeRemaining")
                
                # Make sure we have at least one valid value
                if pausedTime is None and pausedTimeRemaining is not None:
                    pausedTime = pausedTimeRemaining
                elif pausedTime is None and pausedTimeRemaining is None:
                    # Calculate from startTime if possible
                    if "startTime" in timer_state and timer_state["startTime"] > 0:
                        elapsed = int(time.time() * 1000) - timer_state["startTime"]
                        pausedTime = max(0, (timer_state.get("duration", 60) * 1000) - elapsed)
                    else:
                        # Fallback to full duration
                        pausedTime = timer_state.get("duration", 60) * 1000
                
                # Update timer state with valid pausedTime
                global_timer_update({
                    "type": "timer-pause",
                    "pausedTime": pausedTime,
                    "pausedTimeRemaining": pausedTime  # Make them consistent
                })
                
                # Broadcast to all clients
                await broadcast(timer_state)
                
            elif data.get("type") == "timer-reset":
                # Store the duration before resetting
                duration = timer_state.get("duration", 60)
                
                timer_state = {
                    "type": "timer-reset",
                    "isRunning": False,
                    "startTime": 0,
                    "pausedTime": duration * 1000,
                    "pausedTimeRemaining": duration * 1000,
                    "duration": duration
                }
                
                # Broadcast just once
                await broadcast(timer_state)
                
            elif data.get("type") == "timer-sync-request":
                # Send current timer state to the client
                await websocket.send(json.dumps(timer_state))
                
            elif data.get("type") == "ping":
                # Just respond with a pong to keep the connection alive
                await websocket.send(json.dumps({"type": "pong"}))
    except Exception as e:
        print(f"Error handling client {client_info}: {e}")
    finally:
        connected_clients.remove(websocket)
        print(f"Client disconnected: {client_info}")

def global_timer_update(new_state):
    global timer_state
    
    if new_state.get('type') == 'timer-pause':
        # Ensure pausedTime is valid
        if 'pausedTime' in new_state and new_state['pausedTime'] is None:
            new_state['pausedTime'] = new_state.get('pausedTimeRemaining', 0)
        
        # Ensure isRunning is set to false
        new_state['isRunning'] = False
    
    elif new_state.get('type') == 'timer-reset':
        # Start fresh with only essential properties
        reset_data = {
            "type": "timer-reset",
            "isRunning": False,
            "startTime": 0,
            "pausedTime": 0,
            "pausedTimeRemaining": 0,
            "duration": new_state.get('duration', 60)
        }
        timer_state.clear()
        timer_state.update(reset_data)
        return
    
    # Normal property update
    updated_state = timer_state.copy()
    updated_state.update(new_state)
    timer_state = updated_state
    
    # Ensure we have valid type
    if 'type' not in timer_state:
        timer_state['type'] = 'timer-sync'

async def broadcast(message):
    if connected_clients:
        # Convert message to JSON string if it's a dict
        if isinstance(message, dict):
            message_str = json.dumps(message)
        else:
            message_str = message
        
        # Send to all clients
        websockets_to_remove = set()
        for websocket in connected_clients:
            try:
                await websocket.send(message_str if isinstance(message_str, str) else json.dumps(message_str))
            except websockets.exceptions.ConnectionClosed:
                websockets_to_remove.add(websocket)
        
        # Clean up any closed connections
        for websocket in websockets_to_remove:
            connected_clients.remove(websocket)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            if local_ip != '127.0.0.1':
                return local_ip
        except:
            pass
        return 'localhost'

class QRCodeWindow:
    def __init__(self, url):
        self.root = tk.Tk()
        self.root.title("Score Counter - Mobile Controls")
        
        # Window dimensions and positioning
        window_width = 400
        window_height = 500
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x_position = screen_width - window_width - 20
        y_position = 20
        self.root.geometry(f"{window_width}x{window_height}+{x_position}+{y_position}")
        
        # Create and pack main frame
        main_frame = tk.Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title = tk.Label(main_frame, text="Score Counter", font=("Arial", 18, "bold"))
        title.pack(pady=(0, 20))
        
        # Instructions
        instructions = tk.Label(main_frame, 
                                text="Scan this QR code with your mobile device\nto control the score counter",
                                font=("Arial", 12),
                                justify=tk.CENTER)
        instructions.pack(pady=(0, 15))
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Convert QR code to a Tkinter-compatible image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        qr_img.save(buffer, format="PNG")
        buffer.seek(0)
        img = ImageTk.PhotoImage(Image.open(buffer))
        
        # Display QR code
        qr_label = tk.Label(main_frame, image=img)
        qr_label.image = img  # Keep a reference to prevent garbage collection
        qr_label.pack(pady=10)
        
        # URL text display
        url_label = tk.Label(main_frame, text=url, font=("Arial", 10), fg="blue")
        url_label.pack(pady=5)
        
        # Add server info
        server_info = tk.Label(main_frame, 
                               text=f"HTTP Server: Port {HTTP_PORT}\nWebSocket Server: Port {WS_PORT}",
                               font=("Arial", 10),
                               justify=tk.CENTER)
        server_info.pack(pady=(20, 0))

    def run(self):
        self.root.mainloop()

async def start_websocket_server():
    async with websockets.serve(counter_server, "0.0.0.0", WS_PORT):
        print(f"WebSocket server started on 0.0.0.0:{WS_PORT}")
        await asyncio.Future()  # Keep the server running forever

def main():
    # Get local IP
    local_ip = get_local_ip()
    
    # Start HTTP server in a separate thread
    http_server = ScoreCounterHTTPServer()
    http_server.start()
    print(f"HTTP server started on port {HTTP_PORT}")
    
    # Create and display the QR code window in a separate thread
    url = f"http://{local_ip}:{HTTP_PORT}/buttons.html"
    qr_thread = threading.Thread(target=lambda: QRCodeWindow(url).run(), daemon=True)
    qr_thread.start()
    
    # Open the display page in the default browser
    display_url = f"http://localhost:{HTTP_PORT}/display.html"
    webbrowser.open(display_url)
    
    # Start WebSocket server in the main thread
    try:
        asyncio.run(start_websocket_server())
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        http_server.stop()

if __name__ == "__main__":
    main()