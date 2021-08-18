import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';
import { Marcador } from './modelos/marcador';
import { Subscriber, Observable } from 'rxjs';
import { ApiService } from './servicios/api.service'
import { ChildActivationStart } from '@angular/router';
declare var $: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'PMapasWeb';
  badgeColor = 'badge-success';
  center = { lat: -1.3099389, lng: -78.5112209 };
  zoom = 15;
  uuidUso='';
  map!: google.maps.Map;
  yo!: google.maps.Marker;
  dispositivos: any = [];
  constructor(private apiSer: ApiService) { }
  pedidosAll:any=[];
  pedidosAllAux:any=[];
  ngOnInit() {
    this.cargarFecha();
    this.cargarMapa();
    this.socket = io(this.url);
    this.iniciarSocket();
    this.cargarDispositivos();
    //this.getPedidosAll();
    //this.añadirPunto("1","-1.312023", "-78.507918","123","asd","asd");
  }

  cargarDispositivos() {
    this.apiSer.getDispositivos().subscribe(
      res => {
        this.dispositivos=res;
        console.log(this.dispositivos);
        this.getPedidosAll();
  
      },
      err => {
        console.log(err);
      }
    );
  }
  activeDisDrop(id:string){
    console.log(id);
    for (let index = 0; index < this.dispositivos.length; index++) {
      (<HTMLDivElement>document.getElementById('drop-'+this.dispositivos[index].UUID)).classList.remove('active');
      
    }
    (<HTMLDivElement>document.getElementById('drop-'+id)).classList.add('active');

    this.uuidUso=id;
  }
  cargarFecha() {
    var txtdate = (<HTMLInputElement>document.getElementById('txtdate'));
    var f = new Date();
    var dia: string = f.getDate().toString();
    if (dia.length == 1) {
      dia = "0" + dia;
    }
    var mes: string = (f.getMonth() + 1).toString();
    if (mes.length == 1) {
      mes = "0" + mes;
    }
    var date = f.getFullYear() + "-" + mes + "-" + dia;
    console.log(date);
    txtdate.value = date;
  }
  cargarMapa() {

    var m = <HTMLDivElement>document.getElementById('map');
    this.map = new google.maps.Map(m, {
      center: this.center,
      zoom: this.zoom
    });




  }
  socket: any;
  readonly url: string = "http://192.168.1.14:3000/";
  listen(eventName: string) {
    return new Observable((Subscriber) => {
      this.socket.on(eventName, (data: unknown) => {
        Subscriber.next(data);
      })
    });
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  iniciarSocket() {

    this.listen('Ubicacion').subscribe((data) => {
      console.log(data);
      //let d = <{ Id,UUID,manufacture,model, Lat, lon, guardar }>data;
      //this.marcarPunto(d.Lat, d.lon,d.Id,d.UUID,d.manufacture,d.model);
      let d = <{ id, UUID, manufacture, model, Lat, lon }>data;
      this.ActualizarPunto(d.id, d.Lat, d.lon, d.UUID, d.manufacture, d.model);

    });
    this.listen('Desconectar').subscribe((data) => {
      console.log('desconectar', data);
      this.eliminarMarcador(data)
      //let d = <{ Id,UUID,manufacture,model, Lat, lon, guardar }>data;
      //this.marcarPunto(d.Lat, d.lon,d.Id,d.UUID,d.manufacture,d.model);


    });
  }
  marcadores: Marcador[] = [];
  setMapOnAll(map: google.maps.Map | null) {
    for (let i = 0; i < this.marcadores.length; i++) {
      this.marcadores[i].Marker.setMap(map);
    }
  }
  eliminarMarcador(id) {
    for (let index = 0; index < this.marcadores.length; index++) {
      if (this.marcadores[index].id == id) {
        this.marcadores[index].Marker.setMap(null);
        if (this.marcadores.length == 1) {
          this.marcadores = [];
        } else {
          this.marcadores.splice(index, 1);
        }

        console.log(this.marcadores);

      }

    }
  }

  ActualizarPunto(id, lat, lon, uuid, manifacture, modelo) {
    console.log('tamaño act', this.marcadores.length);
    for (let index = 0; index < this.marcadores.length; index++) {
      if (this.marcadores[index].UUID == uuid) {
        this.marcadores[index].Marker.setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });

        return;
      }

    }
    this.añadirPunto(id, lat, lon, uuid, manifacture, modelo);


  }
  añadirPunto(id, lat, lon, uuid, manifacture, modelo) {
    var maux: google.maps.Marker = new google.maps.Marker({
      position: { lat: parseFloat(lat), lng: parseFloat(lon) },
      icon: "./assets/truck32.png",

      map: this.map,
    });
    const contentString =
      "<script>function cl(){console.log('vaaa');}</script>" +
      '<div id="content">' +
      '<div id="siteNotice">' +
      "</div>" +
      '<h2 id="firstHeading" class="firstHeading">' + uuid + '</h2>' +
      '<div id="bodyContent">' +
      "<h3> " + modelo + "-" + manifacture + "</h3>" +
      ' ' +
      "</div>" +
      "</div> ";
    const infowindow = new google.maps.InfoWindow({
      content: contentString,
    });
    maux.addListener("click", () => {
      infowindow.open(this.map, maux);
      // this.codigoClk= punto.codigo;
    });
    let mar: Marcador = { Lat: lat, Lon: lon, Manufacture: manifacture, Marker: maux, Model: modelo, UUID: uuid, id: id };
    this.marcadores.push(mar);



  }
  ckllive() {
    this.setMapOnAll(this.map);
    this.eliminarMarcadoresPedidos(null);
    this.eliminarMarcadoresIntermedios(null);
    this.directionsRenderer.setMap(null);
  }
  cklpedidos() {

  }
  pedidos:any=[];
  puntosRuta:any=[];
  async clkVerRuta() {
    var date = (<HTMLInputElement>document.getElementById('txtdate')).value;
    console.log(date);
    this.setMapOnAll(null);
    await this.cargarPedidos(this.uuidUso,date);
   // await this.cargarPuntos(this.uuidUso,date);
   // await this.calculateAndDisplayRoute();



  }
  directionsRenderer = new google.maps.DirectionsRenderer();
   directionsService = new google.maps.DirectionsService();
   
  calculateAndDisplayRoute() {
    var wait:{lat:number,lon:number}[]=this.getWaitpoints();
    this.directionsRenderer.setMap(this.map);
    this.directionsService.route(
      {
        origin: { lat:Number.parseFloat( this.puntosRuta[0].lat), lng: Number.parseFloat(this.puntosRuta[0].lon)  },
        destination: { lat:Number.parseFloat( this.puntosRuta[this.puntosRuta.length-1].lat), lng: Number.parseFloat(this.puntosRuta[this.puntosRuta.length-1].lon) },
        
        travelMode: google.maps.TravelMode.DRIVING,

      },
      (response, status) => {
        if (status == "OK") {
          this.directionsRenderer.setDirections(response);
        } else {
          window.alert("Error al trazar la ruta");
        }
      }
    );
    
      this.eliminarMarcadoresIntermedios(null);
    for (let index = 0; index < wait.length; index++) {
      this.añadirMarcadorIntermedioRuta(wait[index].lat,wait[index].lon );
      
    }

  }
  marcadoresmidleRoute:google.maps.Marker[]=[];
  añadirMarcadorIntermedioRuta(lat,lon){
    var maux: google.maps.Marker = new google.maps.Marker({
      position: { lat: parseFloat(lat), lng: parseFloat(lon) },
      icon: "./assets/point.png",

      map: this.map,
    });
    
    this.marcadoresmidleRoute.push(maux);
  }
  eliminarMarcadoresIntermedios(map: google.maps.Map | null) {
    for (let i = 0; i < this.marcadoresmidleRoute.length; i++) {
      this.marcadoresmidleRoute[i].setMap(map);
    }
    this.marcadoresmidleRoute=[];
  }
  getWaitpoints(){
     var arrReturn:{lat:number,lon:number}[]=[];
     for (let index = 1; index < this.puntosRuta.length-1; index++) {
      var lu={lat:Number.parseFloat( this.puntosRuta[index].lat),lon: Number.parseFloat( this.puntosRuta[index].lon)};
      
      arrReturn.push( lu );
       
     }
     console.log('wait',arrReturn);
     return arrReturn;
  }
 async cargarPuntos(uuid,fecha){
    console.log('puntos',uuid,fecha);
    this.apiSer.getPuntos(uuid,fecha).subscribe(
      res => {
        this.puntosRuta=res;
        console.log('puntos',this.puntosRuta);
        this.calculateAndDisplayRoute();
  
      },
      err => {
        console.log(err);
      }
    );
  }
 async cargarPedidos(uuid,fecha){
    console.log('pedidos',uuid,fecha);
    this.apiSer.getPedidos(uuid,fecha).subscribe(
      res => {
        this.pedidos=res;
        console.log('pedidos',this.pedidos);
        this.marcarPedidos();
        this.cargarPuntos(uuid,fecha);
  
      },
      err => {
        console.log(err);
      }
    );
  }
  marcadoresPedidos:google.maps.Marker[]=[];
  marcarPedidos(){
    this.eliminarMarcadoresPedidos(null);
    for (let index = 0; index < this.pedidos.length; index++) {
        this.añadirMarcadorPedido(this.pedidos[index]);
      
    }
  }
  
  añadirMarcadorPedido(ped:any){
    console.log('ped',ped);
    var maux: google.maps.Marker = new google.maps.Marker({
      position: { lat: parseFloat(ped.Lat), lng: parseFloat(ped.Lon) },
      icon: "./assets/shop.png",

      map: this.map,
    });
    const contentString =
      "<script>function cl(){console.log('vaaa');}</script>" +
      '<div id="content">' +
      '<div id="siteNotice">' +
      "</div>" +
      '<h2 id="firstHeading" class="firstHeading">' + ped.Cliente.Nombre + '</h2>' +
      '<div id="bodyContent">' +
      "<h3> " + ped.Cliente.Cedula +"</h3>" +
      "<h3> " + ped.Cliente.Direccion +"</h3>" +
      "<h3> " + ped.Cliente.Tienda +"</h3>" +
      ' ' +
      "</div>" +
      "</div> ";
    const infowindow = new google.maps.InfoWindow({
      content: contentString,
    });
    maux.addListener("click", () => {
      infowindow.open(this.map, maux);
      // this.codigoClk= punto.codigo;
    });
    //let mar: Marcador = { Lat: lat, Lon: lon, Manufacture: manifacture, Marker: maux, Model: modelo, UUID: uuid, id: id };
    this.marcadoresPedidos.push(maux);
  }
  eliminarMarcadoresPedidos(map: google.maps.Map | null) {
    for (let i = 0; i < this.marcadoresPedidos.length; i++) {
      this.marcadoresPedidos[i].setMap(map);
    }
    this.marcadoresPedidos=[];
  }
  getPedidosAll(){
    this.apiSer.getPedidosAll().subscribe(
      res => {
        //this.pedidosAll=res;
        console.log(res,res.length);
        for (let index = 0; index < res.length; index++) {
          for (let index2 = 0; index2 < this.dispositivos.length; index2++) {
            console.log(index,index2); 
            if(res[index].UUID==this.dispositivos[index2].UUID){
              res[index].dis=this.dispositivos[index2];
              }


            
          }

         
        }
        this.pedidosAll=res;
        this.pedidosAllAux=res;
        console.log('all',this.pedidosAll);
  
      },
      err => {
        console.log(err);
      }
    );
  }
  clkFiltrarModal(){
    this.pedidosAll=this.pedidosAllAux;
    var dateFecha=(<HTMLInputElement>document.getElementById('txtdateFil')).value;
    //txtdateFil
    const result = this.pedidosAll.filter((ped: {Productos:{ _id, Nombre , Cantidad }[],Cliente:{_id, Nombre , Cedula , Tienda, Direccion},Lat, Lon,Date,Time,UUID,dis:{UUID,manufacture,model,_id} }) => ped.Date.search(dateFecha) >= 0

        );
      this.pedidosAll = result;



  }
  pedidoEnUso:{Productos:{ _id, Nombre , Cantidad }[],Cliente:{_id, Nombre , Cedula , Tienda, Direccion},Lat, Lon,Date,Time,UUID,dis:{UUID,manufacture,model,_id} }=
  {Productos:[{ _id:"", Nombre:"" , Cantidad:"" }],Cliente:{_id:"", Nombre:"" , Cedula:"" , Tienda:"", Direccion:""},Lat:"", Lon:"",Date:"",Time:"",UUID:"",dis:{UUID:"",manufacture:"",model:"",_id:""} };
  clkFverDetalles(ped:any){
    this.pedidoEnUso=ped;
    $('#ModalPedidosDetalle').modal('show');

  }

}
