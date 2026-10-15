'use strict';
// Starter documents so Drishti works offline. Short original summaries; replace with real crawls via `drishti crawl`.
const W = 'https://en.wikipedia.org/wiki/';
module.exports = [
  ['Taj_Mahal', 'Taj Mahal', 'The Taj Mahal is a white marble mausoleum in Agra, Uttar Pradesh, built by the Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal. Construction took over two decades, and it is a UNESCO World Heritage Site visited by millions each year.'],
  ['Indian_Railways', 'Indian Railways', 'Indian Railways is a state-owned railway network connecting cities and villages across the country. It carries millions of passengers every day and runs one of the largest freight services in the world.'],
  ['ISRO', 'ISRO: Indian Space Research Organisation', 'ISRO is the space agency of India, headquartered in Bengaluru. It launched the Chandrayaan lunar missions and the Mangalyaan Mars orbiter, and operates satellites for communication, navigation and weather forecasting.'],
  ['Ayurveda', 'Ayurveda', 'Ayurveda is a traditional system of medicine that originated in India thousands of years ago. It uses herbs, diet, massage and lifestyle practices to promote balance between body and mind.'],
  ['Hyderabadi_biryani', 'Hyderabadi biryani', 'Hyderabadi biryani is a rice and meat dish from Hyderabad, Telangana, cooked slowly with saffron and spices. Kachchi and pakki are the two main styles, depending on whether the meat is cooked raw or in advance.'],
  ['Diwali', 'Diwali: the festival of lights', 'Diwali is celebrated across India with oil lamps, rangoli, sweets and fireworks. It marks the triumph of light over darkness and falls in October or November, depending on the lunar calendar.'],
  ['Kerala_backwaters', 'Kerala backwaters', 'The Kerala backwaters are a network of lagoons, lakes and canals along the Arabian Sea coast. Visitors travel through them on traditional houseboats, passing coconut groves and fishing villages.'],
  ['Cricket_in_India', 'Cricket in India', 'Cricket is the most popular sport in India. The national team plays Test matches, one day internationals and T20 games, and the Indian Premier League draws large crowds and television audiences.'],
  ['Hindi', 'Hindi language', 'Hindi is written in the Devanagari script and is one of the most widely spoken languages in the world. It is an official language of India alongside English, and shares much of its vocabulary with Sanskrit and Urdu.'],
].map(([slug, title, text]) => ({ url: W + slug, title, text }));
