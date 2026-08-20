# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MIT

from enum import Enum

from flask import Flask, Response, jsonify, render_template, request
from openai import OpenAI

from simplifier import simplify


class RespondStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"


class RespondType(Enum):
    INFORM = "inform"
    SIMPLIFY = "simplify"


MODEL_CONFIG = {"base_url": "", "model": "", "api_key": ""}
CLIENT = None
app = Flask(__name__)


def respond(
    status: RespondStatus, type_: RespondType, message: str, code: int
) -> tuple[Response, int]:
    """Generates reply for requests

    Args:
        status (RespondStatus): status of request result
        type_ (RespondType): type of the reply
        message (str): message to reply
        code (int): HTTP status code

    Returns:
        tuple[Response, int]: The reply to the request initiator
    """
    return jsonify({"status": status, "type": type_, "message": message}), code


def is_config_valid(config: dict[str, str]) -> bool:
    """Config will be valid if it has same keys and different values with MODEL_CONFIG"""
    return (
        True
        if MODEL_CONFIG.keys() == config.keys() and MODEL_CONFIG != config
        else False
    )


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/submit-model-config")
def create_client():
    """Creates model client according to model config submitted"""
    global CLIENT
    config = request.get_json()

    if is_config_valid(config):
        MODEL_CONFIG.update(config)
    else:
        return respond(
            RespondStatus.ERROR,
            RespondType.INFORM,
            "Request does not contain valid model configuration or client is already created.",
            400,
        )  # The client is created if values of config is the same as those of MODEL_CONFIG

    CLIENT = OpenAI(api_key=MODEL_CONFIG["api_key"], base_url=MODEL_CONFIG["base_url"])
    return respond(
        RespondStatus.SUCCESS,
        RespondType.INFORM,
        "Model configuration submitted successfully.",
        200,
    )


@app.post("/api/simplify-text/<string:original_text>")
def simplify_text(original_text: str) -> tuple[Response, int]:
    """Simplifies the text given

    Args:
        original_text (str): text to be simplified

    Returns:
        tuple[Response, int]: The simplified text.
    """
    if CLIENT is None:
        return respond(
            RespondStatus.ERROR, RespondType.INFORM, "Client is not set up.", 400
        )

    if simplified_text := simplify(CLIENT, MODEL_CONFIG["model"], original_text):
        return respond(
            RespondStatus.SUCCESS, RespondType.SIMPLIFY, simplified_text, 200
        )

    return respond(
        RespondStatus.ERROR,
        RespondType.INFORM,
        "Unable to simplify text. Please check model configuration.",
        500,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1")
