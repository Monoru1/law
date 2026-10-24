"""Original offline sound design. Standard library only; no sampled recordings."""
import math, random, struct, wave
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / "public" / "rebirth"
RATE = 22050
random.seed(417)
def render(name, seconds, sound):
    samples = [max(-.92, min(.92, sound(i / RATE))) for i in range(int(seconds * RATE))]
    with wave.open(str(ROOT / (name + ".wav")), "wb") as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(RATE)
        output.writeframes(b"".join(struct.pack("<h", int(x * 32767)) for x in samples))
low = 0.0
mid = 0.0
def weather(t):
    global low, mid
    white = random.uniform(-1, 1)
    low = .995 * low + .005 * white
    mid = .78 * mid + .22 * white
    return .31 * mid + .8 * low * (.55 + .25 * math.sin(2 * math.pi * t / 12)) + .06 * math.sin(2 * math.pi * 1300 * t) * math.exp(-90 * (t % .473))
render("rain", 12, weather)
low = 0.0
def school(t):
    global low
    low = .985 * low + .015 * random.uniform(-1, 1)
    return .9 * low + .08 * math.sin(2 * math.pi * 73 * t) + .03 * math.sin(2 * math.pi * 146 * t) + .035 * math.sin(2 * math.pi * 431 * t) * math.exp(-3 * (t % 4))
render("school-air", 12, school)
# Authored synthetic felt-piano phrase, inharmonic partials and reflected taps.
notes = [(0,146.83),(3,174.61),(6,138.59),(9,164.81)]
def score(t):
    total = 0.0
    for start, frequency in notes:
        for delay, gain in [(0,1),(.19,.3),(.43,.17)]:
            d = t - start - delay
            if d >= 0:
                total += gain * (1 - math.exp(-65*d)) * math.exp(-1.1*d) * (math.sin(2*math.pi*frequency*d) + .23*math.sin(2*math.pi*frequency*2.002*d) + .08*math.sin(2*math.pi*frequency*3*d))
    return .13 * total
render("score", 12, score)
render("paper", .65, lambda t: random.uniform(-1,1)*.24*math.sin(math.pi*t/.65)**2*(.5+.5*math.sin(100*t)))
render("door", 1.8, lambda t: .18*math.sin(2*math.pi*(82*t-9*t*t))*math.exp(-2.5*t) + random.uniform(-1,1)*.14*math.exp(-8*abs(t-.6)))
render("steps", 1.5, lambda t: random.uniform(-1,1)*.22*sum(math.exp(-40*abs(t-k)) for k in [.1,.55,1.05]) + .08*math.sin(2*math.pi*95*t)*sum(math.exp(-25*abs(t-k)) for k in [.1,.55,1.05]))
render("phone", 1.2, lambda t: .08*(math.sin(2*math.pi*440*t)+math.sin(2*math.pi*480*t))*(1 if t % .6 < .3 else 0)*min(1,t*50))
render("electric", .8, lambda t: random.uniform(-1,1)*.16*math.exp(-4*t)+.06*math.sin(2*math.pi*100*t)*math.exp(-6*t))
render("clock", .35, lambda t: .15*math.sin(2*math.pi*1100*t)*math.exp(-80*t)+random.uniform(-1,1)*.08*math.exp(-60*t))
print("Created nine original ambience, score and Foley files.")
