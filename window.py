# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MIT

"""
window.py
This file contains the main GUI window for the long text simplifier application.

Author: Jaxon Ma
Date: 2026-07-11
"""

import threading
import tkinter as tk
from tkinter import ttk

from openai import OpenAI
from simplifier import get_env_settings, simplify

INSTRUCTIONS = "Please edit BASE_URL and API_KEY in your .env file first so the simplifier can run successfully.\n\n" + \
                "Then paste text above or type it directly, and click Simplify.\n\n" + \
                "To change the model, edit MODEL in your .env file, then restart the application."


class MainWindow(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Long Text Simplifier")
        self.geometry("400x500")

        self._build_client()
        self._create_widgets()
        self._layout_widgets()

    def _build_client(self):
        env_settings = get_env_settings()
        self.client = OpenAI(api_key=env_settings["api_key"], base_url=env_settings["base_url"])
        self.model = env_settings["model"]

    def _create_widgets(self):
        self.input_label = ttk.Label(self, text="Original Text:", anchor="w")
        self.input_text = tk.Text(
            self,
            wrap="word",
            undo=True,
            highlightthickness=0,
            highlightbackground=self.cget("bg"),
            highlightcolor=self.cget("bg"),
            bd=0,
            relief="flat",
            padx=8,
            pady=8,
            font=("TkDefaultFont", 14),
        )
        self.input_scroll = ttk.Scrollbar(self, orient="vertical", command=self.input_text.yview)
        self.input_text.configure(yscrollcommand=self.input_scroll.set)
        self.input_text.bind("<<Modified>>", self._on_input_modified)

        self.button_frame = ttk.Frame(self)
        self.paste_button = ttk.Button(self.button_frame, text="Paste", command=self._paste_text)
        self.simplify_button = ttk.Button(self.button_frame, text="Simplify", command=self._simplify_text)
        self.copy_button = ttk.Button(
            self.button_frame,
            text="Copy Simplified Text",
            command=self._copy_simplified_text,
        )

        self.output_label = ttk.Label(self, text="Simplified Text:", anchor="w")
        self.output_text = tk.Text(
            self,
            wrap="word",
            undo=True,
            highlightthickness=0,
            highlightbackground=self.cget("bg"),
            highlightcolor=self.cget("bg"),
            bd=0,
            relief="flat",
            padx=8,
            pady=8,
            font=("TkDefaultFont", 14),
        )
        self.output_text.tag_configure("instructions", foreground="gray")

        self.output_scroll = ttk.Scrollbar(self, orient="vertical", command=self.output_text.yview)
        self.output_text.configure(yscrollcommand=self.output_scroll.set)
        self.output_text.insert("1.0", INSTRUCTIONS, "instructions")
        self.output_text.configure(state="disabled")

        self.status_var = tk.StringVar(value=f"Ready (Using {self.model})")
        self.status_label = ttk.Label(self, textvariable=self.status_var, anchor="w")

    def _layout_widgets(self):
        self.columnconfigure(0, weight=1)
        self.columnconfigure(1, weight=0)

        self.rowconfigure(1, weight=1)
        self.rowconfigure(4, weight=1)

        self.input_label.grid(row=0, column=0, sticky="ew", padx=12, pady=(12, 4))
        self.input_text.grid(row=1, column=0, sticky="nsew", padx=(12, 0), pady=(0, 12))
        self.input_scroll.grid(row=1, column=1, sticky="ns", padx=(0, 12), pady=(0, 12))

        self.button_frame.grid(row=2, column=0, columnspan=2, sticky="ew", padx=12, pady=(0, 12))
        self.button_frame.columnconfigure(0, weight=1)
        self.button_frame.columnconfigure(1, weight=1)
        self.button_frame.columnconfigure(2, weight=2)
        self.paste_button.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.simplify_button.grid(row=0, column=1, sticky="ew", padx=(0, 8))
        self.copy_button.grid(row=0, column=2, sticky="ew")

        self.output_label.grid(row=3, column=0, sticky="ew", padx=12, pady=(0, 4))
        self.output_text.grid(row=4, column=0, sticky="nsew", padx=(12, 0), pady=(0, 12))
        self.output_scroll.grid(row=4, column=1, sticky="ns", padx=(0, 12), pady=(0, 12))

        self.status_label.grid(row=5, column=0, columnspan=2, sticky="ew", padx=12, pady=(0, 12))

    def _set_status(self, message: str, is_error: bool = False, is_info: bool = False):
        self.status_var.set(message)
        if is_error:
            self.status_label.configure(foreground="tomato")
        elif is_info:
            self.status_label.configure(foreground="steelblue")
        else:
            self.status_label.configure(foreground="")

    def _on_input_modified(self, event: tk.Event):
        if self.input_text.edit_modified():
            text = self.input_text.get("1.0", "end")
            wrap_mode = self._get_wrap_mode(text)
            self.input_text.configure(wrap=wrap_mode)
            self.input_text.edit_modified(False)

    def _get_wrap_mode(self, text: str) -> str:
        # This function checks if the text contains any CJK characters.
        for character in text:
            code_point = ord(character)
            if (
                0x4E00 <= code_point <= 0x9FFF or
                0x3400 <= code_point <= 0x4DBF or
                0x20000 <= code_point <= 0x2A6DF or
                0x3040 <= code_point <= 0x309F or
                0x30A0 <= code_point <= 0x30FF or
                0xAC00 <= code_point <= 0xD7AF
            ):
                return "char"
        return "word"

    def _set_widget_wrap(self, widget: tk.Text, text: str):
        widget.configure(wrap=self._get_wrap_mode(text))

    def _paste_text(self):
        try:
            clipboard_text = self.clipboard_get()
        except tk.TclError:
            clipboard_text = ""

        if not clipboard_text:
            self._set_status("Clipboard does not contain text.", is_error=True)
            return

        self.input_text.delete("1.0", "end")
        self.input_text.insert("1.0", clipboard_text)
        self._set_status("Pasted text from clipboard.")

    def _simplify_text(self):
        source_text = self.input_text.get("1.0", "end").strip()
        if not source_text:
            self._set_status("Please enter or paste text to simplify.", is_error=True)
            return

        self._set_status("Simplifying text...", is_info=True)
        self.paste_button.configure(state="disabled")
        self.simplify_button.configure(text="Simplifying...", state="disabled")
        self.copy_button.configure(state="disabled")

        thread = threading.Thread(target=self._run_simplify, args=(source_text,), daemon=True)
        thread.start()

    def _run_simplify(self, source_text: str):
        simplified_text = simplify(self.client, self.model, source_text)
        self.after(0, self._finish_simplify, simplified_text)

    def _finish_simplify(self, simplified_text: str | None):
        if simplified_text is None:
            self._set_status("Failed to simplify text. Check your settings or your network.", is_error=True)
        else:
            self.output_text.configure(state="normal")
            self.output_text.delete("1.0", "end")
            self._set_widget_wrap(self.output_text, simplified_text)
            self.output_text.insert("1.0", simplified_text)
            self.output_text.configure(state="disabled")
            self._set_status("Text simplified successfully.")

        self.paste_button.configure(state="normal")
        self.simplify_button.configure(text="Simplify", state="normal")
        self.copy_button.configure(state="normal")

    def _copy_simplified_text(self):
        simplified_text = self.output_text.get("1.0", "end").strip()
        if not simplified_text or simplified_text == INSTRUCTIONS:
            self._set_status("No simplified text to copy.", is_error=True)
            return

        self.clipboard_clear()
        self.clipboard_append(simplified_text)
        self._set_status("Copied simplified text to clipboard.", is_info=True)


if __name__ == "__main__":
    app = MainWindow()
    app.mainloop()
