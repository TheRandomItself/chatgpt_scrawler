from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import json
import hashlib
from pathlib import Path


app = Flask(__name__)
cors = CORS(app, send_wildcard=True)
CHATS_DIRECTORY = app.config.get("CHATS_DIRECTORY", "./chats/")

# Ensure the chats directory exists
os.makedirs(CHATS_DIRECTORY, exist_ok=True)

def parseChatContent(chat_file):
    existing_content = [""]
    if os.path.exists(chat_file):
        with open(chat_file, "r", encoding="utf-8") as fp:
            existing_content = json.load(fp)
    else:
        existing_content = []
    

    # if os.path.exists(chat_file):
    #     with open(chat_file, "r", encoding="utf-8") as fp:
    #         existing_content = fp.read()
    result = "".join(existing_content)
    return result

@app.route("/saveArray", methods=["POST"])
def indexNew():
    data = json.loads(request.data)
    body = data["body"]
    chat_id = data.get("chatId", "unknown_chat")

    # print(chat_id)
    # print("the array with the messages is: ")
    # print(body)
    # Generate a safe filename based on the chatId
    safe_chat_id = "".join(c if c.isalnum() else "_" for c in chat_id)
    chat_file = os.path.join(CHATS_DIRECTORY, f"{safe_chat_id}.json")

    # Read existing content from the file, if it exists
    # if os.path.exists(chat_file):
    #     with open(chat_file, "r", encoding="utf-8") as fp:
    #         existing_content = json.load(fp)
    # else:
    #     existing_content = []
    # print("the existing content inside the file" + chat_file + " is: " + existing_content)
    
    with open(chat_file, "w", encoding="utf-8") as fp:
        json.dump(body, fp, indent=4, ensure_ascii=False)
    
    print("chat file data is: ")
    print(parseChatContent(chat_file))
    # # Create a set of hashes for existing lines
    # existing_hashes = set(hashlib.sha256(line.encode()).hexdigest() for line in existing_content)

    # # Prepare new content
    # new_lines = []
    # for line in body.splitlines():
    #     line_hash = hashlib.sha256(line.strip().encode()).hexdigest()
    #     if line.strip() and line_hash not in existing_hashes:
    #         new_lines.append(line.strip() + "\n")
    #         existing_hashes.add(line_hash)

    # # Append new lines to the file in order
    # if new_lines:
    #     with open(chat_file, "a", encoding="utf-8") as fp:
    #         fp.writelines(new_lines)

    return jsonify({"msg": "Chat updated successfully"})

@app.route("/save", methods=["POST"])
def index():
    data = json.loads(request.data)
    body = data["body"]
    chat_id = data.get("chatId", "unknown_chat")

    print(chat_id)
    # Generate a safe filename based on the chatId
    safe_chat_id = "".join(c if c.isalnum() else "_" for c in chat_id)
    chat_file = os.path.join(CHATS_DIRECTORY, f"{safe_chat_id}.txt")

    # Read existing content from the file, if it exists
    if os.path.exists(chat_file):
        with open(chat_file, "r", encoding="utf-8") as fp:
            existing_content = fp.read().splitlines()
    else:
        existing_content = []

    # Create a set of hashes for existing lines
    existing_hashes = set(hashlib.sha256(line.encode()).hexdigest() for line in existing_content)

    # Prepare new content
    new_lines = []
    for line in body.splitlines():
        line_hash = hashlib.sha256(line.strip().encode()).hexdigest()
        if line.strip() and line_hash not in existing_hashes:
            new_lines.append(line.strip() + "\n")
            existing_hashes.add(line_hash)

    # Append new lines to the file in order
    if new_lines:
        with open(chat_file, "a", encoding="utf-8") as fp:
            fp.writelines(new_lines)

    return jsonify({"msg": "Chat updated successfully"})


def parse(filename):
    # Parse the HTML using BeautifulSoup
    path = Path("./", filename).absolute()
    with open(path, "r", encoding="utf-8") as fp:
        text = fp.read()
        return text


@app.route("/chat/<timestamp>")
def show_chat(timestamp):
    path = Path(CHATS_DIRECTORY, timestamp).absolute()
    return parse(path)


@app.route("/parse")
def parse_latest():
    # Get a list of all the files in the directory
    files = os.listdir(CHATS_DIRECTORY)
    # Initialize a variable to keep track of the most recently modified file
    most_recent_file = None
    # Iterate over the list of files
    for file in files:
        # Get the full path of the current file
        file_path = os.path.join(CHATS_DIRECTORY, file)

        if most_recent_file is None or os.path.getmtime(
            file_path
        ) > os.path.getmtime(  # noqa: E501
            most_recent_file
        ):
            # If the current file is more recently modified, store
            # its path as the most recently modified file
            most_recent_file = file_path
    parsed = parse(most_recent_file)
    return render_template("parsed.html", parsed=parsed)


if __name__ == "__main__":
    app.run(debug=True)
