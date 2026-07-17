import { prisma } from "../config/prisma";
import { redis } from "../config/redis";

const LOCATION_TTL_SECONDS = 60;
const RATE_LIMIT_PER_MINUTE = 12;

export type LiveRiderLocation = {
  riderId: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  recordedAt: number;
  persistedAt: number;
};

type SaveResult =
  | { accepted: true; location: LiveRiderLocation; persisted: boolean }
  | { accepted: false; reason: "stale" | "unchanged" | "rate_limited" };

const locationKey = (riderId: string) => `rider:location:${riderId}`;
const rateKey = (riderId: string) => `rider:location:rate:${riderId}`;

const SAVE_LOCATION_SCRIPT = `
local count = redis.call("INCR", KEYS[2])
if count == 1 then redis.call("EXPIRE", KEYS[2], 60) end
if count > tonumber(ARGV[7]) then return cjson.encode({accepted=false, reason="rate_limited"}) end

local previousRaw = redis.call("GET", KEYS[1])
local previous = previousRaw and cjson.decode(previousRaw) or nil
local lat = tonumber(ARGV[1])
local lng = tonumber(ARGV[2])
local isOnline = ARGV[3] == "true"
local recordedAt = tonumber(ARGV[4])
local persistedAt = recordedAt

if previous then
  if recordedAt <= previous.recordedAt then return cjson.encode({accepted=false, reason="stale"}) end
  local radians = math.pi / 180
  local dLat = (lat - previous.lat) * radians
  local dLng = (lng - previous.lng) * radians
  local h = math.sin(dLat / 2)^2 + math.cos(previous.lat * radians) * math.cos(lat * radians) * math.sin(dLng / 2)^2
  local distance = 12742000 * math.atan2(math.sqrt(h), math.sqrt(1 - h))
  local onlineChanged = previous.isOnline ~= isOnline
  if not onlineChanged and distance < tonumber(ARGV[5]) and recordedAt - previous.recordedAt < tonumber(ARGV[6]) then
    return cjson.encode({accepted=false, reason="unchanged"})
  end
  persistedAt = previous.persistedAt
end

local persist = not previous or previous.isOnline ~= isOnline or recordedAt - persistedAt >= 60000
if persist then persistedAt = recordedAt end
local location = { riderId=ARGV[8], lat=lat, lng=lng, isOnline=isOnline, recordedAt=recordedAt, persistedAt=persistedAt }
redis.call("SET", KEYS[1], cjson.encode(location), "EX", ${LOCATION_TTL_SECONDS})
return cjson.encode({accepted=true, location=location, persisted=persist})
`;

export async function saveLiveRiderLocation(
  input: Omit<LiveRiderLocation, "persistedAt">,
): Promise<SaveResult> {
  const raw = await redis.eval(
    SAVE_LOCATION_SCRIPT,
    2,
    locationKey(input.riderId),
    rateKey(input.riderId),
    input.lat,
    input.lng,
    String(input.isOnline),
    input.recordedAt,
    25,
    15_000,
    RATE_LIMIT_PER_MINUTE,
    input.riderId,
  );
  const result = JSON.parse(String(raw)) as SaveResult;
  if (result.accepted && result.persisted) {
    await prisma.riderLocation.upsert({
      where: { riderId: input.riderId },
      create: {
        riderId: input.riderId,
        lat: input.lat,
        lng: input.lng,
        isOnline: input.isOnline,
      },
      update: { lat: input.lat, lng: input.lng, isOnline: input.isOnline },
    });
  }
  return result;
}

export async function getLiveRiderLocation(riderId: string) {
  const raw = await redis.get(locationKey(riderId));
  return raw ? (JSON.parse(raw) as LiveRiderLocation) : null;
}
