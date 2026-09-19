import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { CallAudio } from "../../CoLearner/src/services/callAudio.js";

test("Group playback keeps the recovery control until every blocked output recovers or leaves", async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const elements = [];
  const states = [];
  globalThis.window = {
    MediaStream: class {
      constructor(tracks) {
        this.tracks = tracks;
      }
    },
  };
  globalThis.document = {
    body: { append() {} },
    createElement() {
      const audio = {
        blocked: elements.length !== 1,
        paused: true,
        async play() {
          if (this.blocked)
            throw new DOMException("Autoplay blocked", "NotAllowedError");
          this.paused = false;
        },
        pause() {
          this.paused = true;
        },
        remove() {
          this.removed = true;
        },
      };
      elements.push(audio);
      return audio;
    },
  };
  const output = new CallAudio((blocked) => states.push(blocked));
  try {
    output.add("first", { kind: "audio" });
    await setImmediate();
    assert.equal(states.at(-1), true);
    output.add("second", { kind: "audio" });
    await setImmediate();
    assert.equal(elements[1].paused, false);
    assert.equal(
      states.at(-1),
      true,
      "One playing participant must not hide another blocked participant",
    );
    output.remove("first");
    assert.equal(
      states.at(-1),
      false,
      "Removing the blocked participant clears the warning",
    );
    output.add("third", { kind: "audio" });
    await setImmediate();
    assert.equal(states.at(-1), true);
    elements.forEach((audio) => {
      audio.blocked = false;
    });
    await output.unlock();
    assert.equal(states.at(-1), false);
    assert.equal(elements[2].paused, false);
    output.close();
    assert(
      elements.every(
        (audio) => audio.removed && audio.paused && audio.srcObject === null,
      ),
    );
  } finally {
    output.close();
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});
