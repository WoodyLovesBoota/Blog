---
title: "React에서 Google Maps API 쓰기 - 지도 띄우기부터 장소 검색까지"
description: Google Maps API key를 발급받아 Maps Embed API와 iframe으로 장소·경로 지도를 띄우고, Places API(Find Place, Autocomplete, Place Details)를 useQuery로 호출해 장소를 검색한다. 검색할 때만 요청이 나가도록 useQuery의 enabled 옵션을 쓴다.
date: 2023-10-13
updated: 2026-11-25
tags: [react, google-maps, react-query]
keywords: [Google Maps API, 구글맵, Maps Embed API, iframe, API key, place, directions, waypoints, Places API, Find Place, Autocomplete, Place Details, place_id, useQuery, enabled, rules-of-hooks, 조건부 fetch]
---

React용 Google Maps 라이브러리를 쓰지 않고, URL과 HTTP 요청만으로 Maps Embed API와 Places API를 호출한다.

## API key 발급

Google Cloud Console에서 API key를 발급받는다([발급 과정 정리 글](https://wp.swing2app.co.kr/knowledgebase/googlemap-apikey/)). 가입할 때 결제 수단을 등록해야 하고, 글을 쓸 당시에는 처음 3개월 무료, 이후에는 매달 $200까지 무료였다.

## 1. 지도 띄우기: Maps Embed API

[Maps Embed API](https://developers.google.com/maps/documentation/embed/embedding-map?hl=ko)는 아래 URL을 iframe의 `src`에 넣기만 하면 된다.

```text
https://www.google.com/maps/embed/v1/MAP_MODE?key=YOUR_API_KEY&PARAMETERS
```

- `MAP_MODE`: 지도 종류. `place`, `view`, `search`, `directions` 등이 있다.
- `PARAMETERS`: 모드마다 필요한 값이 다르다.

### place: 한 장소에 핀 찍기

```tsx
const GoogleMap = () => (
  <iframe
    width="500"
    height="500"
    src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=에펠탑&zoom=12`}
  />
);
```

![](/images/react-google-maps/01.webp)

- `q` (필수): 핀을 찍을 장소. 이름, 위도/경도, `place_id` 모두 된다.
- `zoom` (선택): 클수록 좁은 지역을 보여 준다.

### directions: 경로 표시하기

```tsx
const GoogleRouteMap = () => (
  <iframe
    width="500"
    height="500"
    src={`https://www.google.com/maps/embed/v1/directions?key=${API_KEY}&origin=에펠탑&waypoints=루브르박물관|오르세미술관&destination=개선문&mode=walking&zoom=13`}
  />
);
```

![](/images/react-google-maps/02.webp)

- `origin`, `destination` (필수): 출발지와 도착지. 이름, 위도/경도, `place_id`를 넣을 수 있다.
- `waypoints` (선택): 경유지. 여러 곳이면 `|`로 구분한다.
- `mode` (선택): `driving`(기본값), `walking`, `transit` 등. `transit`(대중교통)을 고르면 경유지는 무시된다.

## 2. 장소 검색하기: Places API

Places API는 지도를 그리지 않고 장소 정보를 JSON으로 돌려준다. axios로 요청하고 `useQuery`로 결과를 받았다.

### Find Place: 이름으로 장소 하나 찾기

```text
https://maps.googleapis.com/maps/api/place/findplacefromtext/json?parameters
```

필수 parameter는 `input`(검색어)과 `inputtype`(`textquery` 또는 `phonenumber`)이다. 받고 싶은 정보는 `fields`에 쉼표로 나열한다([문서](https://developers.google.com/maps/documentation/places/web-service/search-find-place?hl=ko)).

```ts
export const getPlace = async (keyword: string) => {
  const res = await axios.get(
    `/maps/api/place/findplacefromtext/json?input=${keyword}&inputtype=textquery&fields=formatted_address%2Cplace_id%2Cphotos%2Cname%2Crating%2Cgeometry&key=${API_KEY}`
  );
  return res.data;
};
```

```tsx
const { data } = useQuery<IPlace>(["getPlace", "eiffel tower"], () => getPlace("eiffel tower"));

const place = data?.candidates[0];

<div>
  <h2>{place?.name}</h2>
  <h2>{place?.formatted_address}</h2>
  <h2>rating: {place?.rating}</h2>
  <h2>lat: {place?.geometry.location.lat}, lng: {place?.geometry.location.lng}</h2>
  <h2>{place?.place_id}</h2>
</div>
```

![](/images/react-google-maps/03.webp)

### Autocomplete: 검색어 자동 완성

```text
https://maps.googleapis.com/maps/api/place/autocomplete/json?parameters
```

정확한 이름을 몰라도 되고 결과를 여러 개 돌려준다. `location`(중심 좌표)과 `radius`(반경, 미터)로 검색 범위를 좁힐 수 있다. 아래 예시는 위에서 찾은 에펠탑 좌표를 중심으로 반경 500m 안에서 검색한 결과다.

```ts
export const getAutoCompletePlaces = async (keyword: string, location: string, radius: number) => {
  const res = await axios.get(
    `/maps/api/place/autocomplete/json?input=${keyword}&location=${location}&radius=${radius}&key=${API_KEY}`
  );
  return res.data;
};
```

```tsx
<ResultList>
  {data.predictions.map((place) => (
    <div key={place.place_id}>
      <h2>{place.structured_formatting.main_text}</h2>
      <h2>{place.description}</h2>
      <h2>{place.place_id}</h2>
    </div>
  ))}
</ResultList>
```

![](/images/react-google-maps/04.webp)

Autocomplete가 주는 정보는 이름, 설명, `place_id` 정도로 적다. [문서](https://developers.google.com/maps/documentation/places/web-service/autocomplete?hl=ko)에서도 자세한 정보가 필요하면 `place_id`로 Place Details를 호출하라고 안내한다.

### Place Details: place_id로 세부 정보 받기

```text
https://maps.googleapis.com/maps/api/place/details/json?parameters
```

영업시간, 배달 여부 등 요청할 수 있는 항목이 많다([문서](https://developers.google.com/maps/documentation/places/web-service/details?hl=ko)). 이름, 평점, 리뷰, 전화번호, 주소, 요약, 좌표, 사진을 한국어로 요청했다.

```ts
export const getPlaceDetail = async (placeId: string) => {
  const res = await axios.get(
    `/maps/api/place/details/json?fields=name%2Crating%2Creviews%2Cinternational_phone_number%2Cformatted_address%2Ceditorial_summary%2Cgeometry%2Cphotos&language=ko&place_id=${placeId}&key=${API_KEY}`
  );
  return res.data;
};
```

```ts
const { data } = useQuery<IGetPlaceDetail>(["getPlaceDetail", placeId], () => getPlaceDetail(placeId));
```

![](/images/react-google-maps/05.webp)

## 3. 검색할 때만 요청 보내기: useQuery의 enabled

위 예제들은 component가 화면에 나타나자마자 요청을 보낸다. 검색 화면에서는 검색 버튼을 누르거나 form을 submit했을 때만 요청이 나가야 한다. 클릭 핸들러 안에서 `useQuery`를 호출하면 다음 lint 에러가 난다.

```text
React Hook "useQuery" is called in function "onYesClicked" that is neither a React function component nor a custom React Hook function.  react-hooks/rules-of-hooks
```

Hook은 component나 custom Hook의 최상단에서만 호출할 수 있다. 이벤트 핸들러나 if문 안에서는 부를 수 없다.

대신 `useQuery`는 그대로 최상단에 두고, **언제 실행할지를 `enabled` 옵션으로** 정한다([문서](https://tanstack.com/query/v4/docs/react/guides/disabling-queries)). `enabled`가 `false`면 query가 실행되지 않고, `true`가 되는 순간 실행된다.

```tsx
const [keyword, setKeyword] = useState("");

const { data } = useQuery({
  queryKey: ["getPlace", keyword],
  queryFn: () => getPlace(keyword),
  enabled: !!keyword,
});

const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setKeyword(e.currentTarget.search.value);
};
```

`keyword`가 비어 있는 동안에는 요청이 나가지 않는다. submit해서 `keyword`에 값이 들어가면 그때 요청이 나가고, 검색어가 `queryKey`에 들어 있으니 검색어를 바꿀 때마다 새로 요청한다.
