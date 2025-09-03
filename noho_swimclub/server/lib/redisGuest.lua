-- KEYS[1] usedKey, KEYS[2] userKey, KEYS[3] verKey
-- ARGV[1] newCount, ARGV[2] perUserMax, ARGV[3] capValue
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local user = tonumber(redis.call('GET', KEYS[2]) or '0')
local ver  = tonumber(redis.call('GET', KEYS[3]) or '0')

local newCount   = tonumber(ARGV[1])
local perUserMax = tonumber(ARGV[2])
local cap        = tonumber(ARGV[3])

if newCount < 0 then return {0, 'bad_newCount'} end
if newCount > perUserMax then return {0, 'exceeds_user_max'} end

local delta = newCount - user
if delta == 0 then
  return {1, used, user, ver}
end

if used + delta > cap then
  return {0, 'exceeds_capacity'}
end

if newCount == 0 then
  if user > 0 then
    redis.call('DECRBY', KEYS[1], user)
    redis.call('DEL', KEYS[2])
  end
else
  redis.call('SET', KEYS[2], newCount)
  redis.call('INCRBY', KEYS[1], delta)
end

ver = redis.call('INCR', KEYS[3])
return {1, used + delta, newCount, ver}
