import sys
import os
import pandas as pd
import numpy as np
import pickle
import warnings
warnings.filterwarnings("ignore")

pkl_file_path = os.path.join(os.path.dirname(__file__), 'rfc.pkl')

with open(pkl_file_path, 'rb') as model_file:
    clf = pickle.load(model_file)


input_data = [list(map(float, sys.argv[1:8]))]

prediction = clf.predict(input_data)

descriptions = [
    'normal',
    'horizontal misalignment 0.5mm',
    'horizontal misalignment 1.0mm',
    'horizontal misalignment 1.5mm',
    'horizontal misalignment 2.0mm',
    'vertical misalignment 0.5mm',
    'vertical misalignment 1.0mm',
    'vertical misalignment 1.5mm',
    'vertical misalignment 2.0mm',
    'Imbalance 6g',
    'Imbalance 10g',
    'Imbalance 15g',
    'Imbalance 20g',
    'Imbalance 25g',
    'Imbalance 30g',
    'Imbalance 35g',
    'overhang ball fault 0g',
    'overhang ball fault 6g',
    'overhang ball fault 20g',
    'overhang ball fault 35g',
    'overhang cage fault 0g',
    'overhang cage fault 6g',
    'overhang cage fault 20g',
    'overhang cage fault 35g',
    'overhang outer race 0g',
    'overhang outer race 6g',
    'overhang outer race 20g',
    'overhang outer race 35g'
]


print("Issue Found : " , descriptions[prediction[0]])
