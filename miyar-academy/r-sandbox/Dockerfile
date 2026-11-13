FROM rocker/r-base:4.4.1

RUN Rscript -e 'install.packages(c("tidyverse","survival","survminer","forecast","tseries","meta","cobalt","randomForest","surveillance"), repos="https://cloud.r-project.org")'

RUN useradd -m -s /bin/bash runner
WORKDIR /r-lab
COPY r-courses/ /r-lab/
RUN chown -R runner:runner /r-lab

USER runner
CMD ["sleep", "infinity"]
