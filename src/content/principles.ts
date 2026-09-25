import type { Principle } from '../engine';
export const principles: Principle[] = [
  { id:'P_INNOCENT', opposite:'P_NOMBRE', statements:[
    {id:'innocent.default',text:'Une personne innocente ne doit pas être sacrifiée pour en sauver d’autres.',isDefault:true},
    {id:'innocent.consent',text:'Une personne innocente ne doit pas être sacrifiée pour en sauver d’autres, sauf si elle y consent.'},
    {id:'innocent.nombre',text:'Une personne innocente ne doit pas être sacrifiée pour en sauver d’autres, sauf si le nombre de vies en jeu est bien plus grand.'}] },
  { id:'P_NOMBRE', opposite:'P_INNOCENT', statements:[
    {id:'nombre.default',text:'Quand je dois choisir, le nombre de vies compte plus que la manière.',isDefault:true},
    {id:'nombre.mains',text:'Quand je dois choisir, le nombre de vies compte plus que la manière, tant que je n’ai pas à agir de mes propres mains.'},
    {id:'nombre.proche',text:'Quand je dois choisir, le nombre de vies compte plus que la manière, sauf quand quelqu’un que j’aime est concerné.'}] },
  { id:'P_SACRIFICE_SOI',statements:[{id:'sacrifice.default',text:'Je donnerais une part de ma vie pour sauver celle des autres.',isDefault:true}] },
  { id:'P_ARGENT',statements:[{id:'argent.default',text:'Aucune somme ne justifie de nuire à quelqu’un.',isDefault:true}] },
];
