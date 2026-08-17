# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MIT

from flask import Flask, request, render_template, jsonify, Response
from simplifier import simplify
from openai import OpenAI

MODEL_CONFIG = {"base_url": "", "model": "", "api_key": ""}
CLIENT = None
app = Flask(__name__)

def generate_reply(status: str, type_: str, message: str, code: int) -> tuple[Response, int]:
    """Generate reply for requests
    
    Args:
        status (str): status of request result, allows "success" or "error"
        type_ (str): type of the reply,  allows "inform" or "simplify"
        message (str): message to reply
        code (int): HTTP status code
        
    Returns:
        tuple[Response, int]: The reply to the request initiator
    """
    if status not in ("success", "error") or type_ not in ("inform", "simplify"):
        raise ValueError("Value of parameter is not allowed.")
    return jsonify({"status": status, "type": type_, "message": message}), code


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/submit-model-config")
def create_client():
    """Create model client according to model config submitted"""
    global CLIENT
    model_config = request.get_json()

    if MODEL_CONFIG.keys != model_config.keys():
        return generate_reply("error", "inform", "Request does not contain valid model configuration.", 400)
    elif MODEL_CONFIG.values == model_config.values():
        return generate_reply("success", "inform", "Clinet already created.", 200)
    else:
        MODEL_CONFIG.update(model_config)

    CLIENT = OpenAI(api_key=MODEL_CONFIG["api_key"], base_url=MODEL_CONFIG["base_url"])
    
    return generate_reply("success", "inform", "Model configuration submitted successfully.", 200)


@app.post("/api/simplify-text/<str:original_text>")
def simplify_text(original_text: str) -> tuple[Response, int]:
    """Simplify text given 
    
    Args:
        original_text (str): text to be simplified

    Returns:
        tuple[Response, int]: The simplified text.
    """
    if CLIENT is None:
        return generate_reply("error", "inform", "Client not set.", 400)

    if simplified_text := simplify(CLIENT, MODEL_CONFIG["model"], original_text):
        return generate_reply("success", "simplify", simplified_text, 200)

    return generate_reply("error", "inform", "Unable to simplify text.", 500)


if __name__ == "__main__":
    app.run(host="127.0.0.1")
