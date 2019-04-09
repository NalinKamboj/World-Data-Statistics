from urllib.request import urlopen
from urllib.request import Request
from bs4 import BeautifulSoup
import json

req = Request(
    "http://en.wikipedia.org/wiki/List_of_Delhi_metro_stations",
    headers={'User-Agent': "Mozilla/5.0"})  
    #fake agent since wiki returns 403 for default requests
source = urlopen(req).read()

print('*******Source read*********\n')
print(source)

soup = BeautifulSoup(source)
rows = soup.findAll('table')[2].findAll('tr')


lst = []
form = '{ "name": "%s",\
          "details": {"layout":"%s",\
                      "line":"[%s]",\
                      "latitude":0.0,\
                      "longitude":0.0 }}'

for row in rows[1:]:
    items = row.findAll('td')
    lst.append(form % (
               items[1].findAll('a')[0].contents[0],
               items[5].contents[0],
               items[3].findAll('a')[0].contents[0]))

string = '['+','.join(lst)+']'

data = json.loads(string)

f = open('metro.json', 'w+')
print('***Dumping metro.json****\n')
f.write(json.dumps(data, indent=4))
f.close()