<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
  ~
-->

Ciao vi scrivo due righe per quanto riguarda terraform,

ho creato la parte AWS con un cluser eks, vedete nelle variabili la possibilità di scegliere la versione
con AWS la creazione di vpc, eks e nodi ci impiega un 20 minuti, per ora sto utilizzando la region milano
quindi va fatta l'opt-in

qui i comandi di terraform:
```
terraform init 
terraform apply -auto-approve  
terraform destroy
```

qui i moduli che ho usato, sono comprensivi di configurazioni custom in caso vengano richiete, per tutti e tre i
provider.


https://registry.terraform.io/providers/hashicorp/aws/latest

https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest

https://registry.terraform.io/providers/hashicorp/google/latest

https://registry.terraform.io/providers/hashicorp/azurerm/latest

non ho potuto provare la parte Azure e GCP

nella parte di aws ho aggiunto commentato un componente molto interessante per risparmiare
ovvero la possibilità di schedulare tramite lambda lo spegnimento di EC2, ed il primo link distrugge tutte le risorse in un dato account può essere molto utile e viene gratis.

https://registry.terraform.io/modules/diodonfrost/lambda-nuke/aws/latest?tab=outputs

https://registry.terraform.io/modules/diodonfrost/lambda-scheduler-stop-start/aws/latest?tab=outputs
