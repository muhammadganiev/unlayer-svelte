import { mount } from "svelte";
import "./demo.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });
