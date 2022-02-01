import "./index.scss";

import { connect } from "socket.io-client";
import Game from "./game/Game";

import type { Socket } from "@/client/types";

const socket: Socket = connect();

socket.once("game:init", (player, data) => {
  new Game(socket, player, data);
});
