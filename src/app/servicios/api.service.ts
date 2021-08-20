import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  constructor(private http: HttpClient) { }
  url='http://137.184.15.154:3000/';

  getDispositivos() { 
   
    return this.http.get<any>(this.url + 'Dispositivos/')
  }
  getPuntos(uuid,fecha) { 
   
    return this.http.get<any>(this.url + 'Puntos/'+fecha+"*"+uuid)
  }
  getPedidos(uuid,fecha) { 
   
    return this.http.get<any>(this.url + 'Pedido/'+fecha+"*"+uuid)
  }
  getPedidosAll() { 
   
    return this.http.get<any>(this.url + 'Pedido/')
  }
}
