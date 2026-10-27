SELECT
  w.*,

  -- include: { Likes: true }
  COALESCE(
    (SELECT json_agg(l) FROM "Like" l WHERE l."wuphfId" = w.id),
    '[]'::json
  ) AS "Likes",

  -- include: { user: { select: { avatar: { select: { url } } } } }
  json_build_object(
    'avatar',
    CASE WHEN a.id IS NULL THEN NULL
         ELSE json_build_object('url', a.url) END
  ) AS "user",

  -- include: { _count: { select: { Likes, Comments } } }
  json_build_object(
    'Likes',    (SELECT count(*) FROM "Like"    l WHERE l."wuphfId" = w.id),
    'Comments', (SELECT count(*) FROM "Comment" c WHERE c."wuphfId" = w.id)
  ) AS "_count"

FROM "Wuphf" w
JOIN "User" u         ON u.username = w."userId"
LEFT JOIN "Avatar" a  ON a."userId" = u.username

WHERE w."userId" = ANY($1::text[])                 -- userId: { in: targetUsernames }

  -- cursor + skip: 1  (omit this clause when there's no cursor)
  AND (
    $2::text IS NULL
    OR (w."createdAt", w.id) < (
         SELECT "createdAt", id FROM "Wuphf" WHERE id = $2
       )
  )

ORDER BY w."createdAt" DESC, w.id DESC             -- id as tiebreaker for stable paging
LIMIT $3;                                          -- take