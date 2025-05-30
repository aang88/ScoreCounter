import asyncio
import json
import websockets
import time
import socket
import firebase_admin
from firebase_admin import firestore
from firebase_admin import credentials
import os
from dotenv import load_dotenv
load_dotenv()  

# Shared state
counters = {}
connected_clients = set()
timer_state = {
    "type": "timer-sync",
    "isRunning": False,
    "startTime": 0,
    "pausedTime": 0
}
match_replay_holder = []
round_count = 1
chung_name = "Unknown"  # Add this line
hong_name = "Unknown"
cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.getenv('FIREBASE_PROJECT_ID'),
    "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
    "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
    "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
    "client_id": os.getenv('FIREBASE_CLIENT_ID'),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token"
})
firebase_admin.initialize_app(cred)
db = firestore.client()

async def counter_server(websocket):
    global timer_state,round_count, match_replay_holder,chung_name, hong_name
    client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
    print(f"New client connected: {client_info}")
    
    #Hold match replay data
    

    connected_clients.add(websocket)
    try:
        # Send initial counter values
        await websocket.send(json.dumps({
            "type": "counters", 
            "values": counters
        }))
        print(f"Sent initial values to {client_info}: {counters}")
        
        # Send initial timer state
        await websocket.send(json.dumps(timer_state))
        
        async for message in websocket:
            print(f"Received message from {client_info}: {message}")
            data = json.loads(message)

            if data['type'] == 'subtract-counter':
                counter_id = data.get('counterId')
                if not counter_id:
                    print("Warning: Received subtract-counter without counter ID")
                    return
                value = data.get('value', 1)
                
                # Prevent negative values
                current_value = counters.get(counter_id, 0)
                new_value = max(0, current_value - value)
                
                counters[counter_id] = new_value

                add_replay_data(data)
                
                # Broadcast updated counter values to all clients
                await broadcast({
                    "type": "counters",
                    "values": counters
                })
            
            if data.get("type") == "increment":
                counter_id = data.get("counterId")
                value = data.get("value", 1)


                # Check if we have a valid counter ID
                if not counter_id:
                    print("Warning: Received increment without counter ID")
                    continue
                
                # Create the counter if it doesn't exist
                if counter_id not in counters:
                    counters[counter_id] = 0
                
                # Increment the counter
                counters[counter_id] += value
                print(f"Incremented {counter_id} to {counters[counter_id]}")
                print(f"All counters now: {counters}")

                add_replay_data(data)
                
                # Broadcast updated counter values
                await broadcast({
                    "type": "counters",
                    "values": counters
                })
                
            elif data.get("type") == "reset-counters":
                # Reset all counters to zero
                counters.clear()
                print("All counters reset")

                await broadcast({
                    "type": "reset-counters"
                })
                
                # Broadcast updated counter values
                await broadcast({
                    "type": "counters",
                    "values": counters
                })
                
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
                
                print(f"Timer started with duration: {duration}, elapsedTime: {elapsed_time}")
                
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
                duration = data.get("duration")
                
                # Only fall back to existing duration if duration isn't in the request
                if duration is None:
                    duration = timer_state.get("duration", 60)
                
                print(f"Timer reset with specified duration: {duration}")
                

                
                # ONLY SEND ONE MESSAGE - Use timer-reset type with pause state properties
                timer_state = {
                    "type": "timer-reset",  # Keep as timer-reset
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

            elif data.get("type") == "round-start":
                round_count += 1

            elif data.get("type") == "game-over":
                # Reset round count and match replay holder
                json_replay = match_replay_to_json()
                game_winner = data.get("game_winner", "unknown")
                final_score = data.get("scores", "0-0")

                match_doc = {
                    'game_winner': game_winner,
                    'final_score': final_score,
                    'replay_data': json_replay,
                    'chung': chung_name,
                    'hong': hong_name,
                    'timestamp': firestore.SERVER_TIMESTAMP
                }
                
                # Add match to the match_replays collection
                match_ref = db.collection('match_replays').add(match_doc)
                match_id = match_ref[1].id

                try:
                    # Update both players' match histories
                    update_player_match_history(chung_name, hong_name, match_id, game_winner, final_score, 'chung')
                    update_player_match_history(hong_name, chung_name, match_id, game_winner, final_score, 'hong')
                except Exception as e:
                    print(f"Error updating player match history: {e}")
                

                round_count = 1
                match_replay_holder.clear()

            elif data.get("type") == "select-player":
                if "hong" in data:
                    hong_name = data.get("hong")
                    print(f"Hong player selected: {hong_name}")
                if "chung" in data:
                    chung_name = data.get("chung")
                    print(f"Chung player selected: {chung_name}")
                print(f"Selected players - Hong: {hong_name}, Chung: {chung_name}")
               
    except Exception as e:
        print(f"Error handling client {client_info}: {e}")
    finally:
        connected_clients.remove(websocket)
        print(f"Client disconnected: {client_info}")

def update_player_match_history(player_name, opponent_name, match_id, game_winner, final_score, player_color):
    try:
        # Find player document
        player_query = db.collection('players').where('name', '==', player_name).limit(1)
        player_docs = player_query.stream()
        
        for doc in player_docs:
            # Get player doc reference
            player_ref = db.collection('players').document(doc.id)
            
            # Determine if this player won
            player_won = game_winner == player_color
            
            # Create match summary for player record
            match_summary = {
                'match_id': match_id,
                'opponent': opponent_name,
                'result': 'win' if player_won else 'loss',
                'score': final_score
            }
            
            # Update player document - add match to matches array
            player_ref.update({
                'matches': firestore.ArrayUnion([match_summary]),
                # Update wins or losses count
                'wins': firestore.Increment(1) if player_won else 0,
                'losses': firestore.Increment(1) if not player_won else 0
            })
            print(f"Updated {player_name}'s match history")
            return True
    
        print(f"Player {player_name} not found in database")
        return False
    except Exception as e:
        print(f"Error updating {player_name}'s match history: {e}")
        return False
    
# In your global_timer_update function
def global_timer_update(new_state):
    global timer_state
    
    # Special handling for timer-pause
    if new_state.get('type') == 'timer-pause':
        # Make sure we have valid pausedTime/pausedTimeRemaining
        if 'pausedTime' in new_state and new_state['pausedTime'] is None:
            # Convert None to a numeric value (use client-provided value if available)
            new_state['pausedTime'] = new_state.get('pausedTimeRemaining', 0)
        
        # Ensure isRunning is set to false
        new_state['isRunning'] = False
    
    # Special handling for timer-reset
    elif new_state.get('type') == 'timer-reset':
        # Start fresh with only essential properties
        duration = new_state.get('duration')
        if duration is None:
            duration = timer_state.get('duration', 60)
        reset_data = {
            "type": "timer-reset",
            "isRunning": False,
            "startTime": 0,
            "pausedTime": 0,
            "pausedTimeRemaining": 0,
            "duration": duration
        }
        timer_state.clear()  # Clear existing contents
        timer_state.update(reset_data)  # Add new contents
        return  # Skip the normal update
    
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
            
        # Log the broadcast
        client_count = len(connected_clients)
        msg_type = message.get("type", "unknown") if isinstance(message, dict) else "raw"
        print(f"Broadcasting {msg_type} message to {client_count} clients")
        
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

def print_clickable_links(ips, http_port=8000):
    print("\n" + "="*70)
    print("🌐 SCORE COUNTER SERVER RUNNING")
    print("="*70)
    
    print("\n📱 ACCESS ON THIS DEVICE:")
    print(f"   http://localhost:{http_port}/display.html")
    print(f"   http://localhost:{http_port}/buttons.html")
    
    if ips:
        print("\n📲 ACCESS FROM OTHER DEVICES:")
        print("-"*50)
        for ip in ips:
            # Make URLs clickable in modern terminals with color highlighting
            print(f"   \033[1;36mhttp://{ip}:{http_port}/display.html\033[0m  <-- CLICK THIS LINK")
            print(f"   http://{ip}:{http_port}/buttons.html")
            print()
    
    print("\n💡 SERVER INFO:")
    print(f"   WebSocket: ws://{ips[0] if ips else 'localhost'}:8765")
    print(f"   Discovery: http://{ips[0] if ips else 'localhost'}:8766/discover")
    
    print("\n💻 COPY THIS URL TO YOUR BROWSER OR PHONE:")
    if ips:
        print(f"   \033[1;32mhttp://{ips[0]}:{http_port}/display.html\033[0m")
    
    print("\n⌨️  Press Ctrl+C to stop the server")
    print("="*70)

def get_local_ip():
    try:
        # This creates a socket that doesn't actually connect
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # This doesn't actually send any packets
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"Error getting local IP: {e}")
        
        # Alternative method
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            if local_ip != '127.0.0.1':  # Avoid returning localhost
                return local_ip
        except Exception as e:
            print(f"Error with alternative IP detection: {e}")
            
        return 'localhost'  # Fallback
    
def add_replay_data(data):
    technique = data.get("technique", "unknown")
    time_stamp = data.get("timestamp", int(time.time() * 1000))
    player = data.get("player", "unknown")

    replay_data = {
        "round": round_count,
        "technique": technique,
        "timestamp": time_stamp,
        "player": player
    }

    match_replay_holder.append(replay_data)
    print(f"Match replay data updated: {match_replay_holder}")

def match_replay_to_json():
    if match_replay_holder:
        return json.dumps(match_replay_holder, indent=4)
    else:
        return "No match replay data available"

# Start server
async def main():
    # Use 0.0.0.0 to accept connections from any IP
    local_ip = get_local_ip()
    async with websockets.serve(counter_server, "0.0.0.0", 8765):
        print("WebSocket server started on 0.0.0.0:8765")
        print_clickable_links([local_ip], 8000)
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())

