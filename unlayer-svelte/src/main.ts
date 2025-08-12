import { mount } from "svelte";
import "./app.css";
import Demo from "./demo/App.svelte";

mount(Demo, { target: document.getElementById("app")! });
