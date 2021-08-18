import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {GoogleMapsModule} from '@angular/google-maps'; 
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    
    AppRoutingModule,
    HttpClientModule,
    GoogleMapsModule

    

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
